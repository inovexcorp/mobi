/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { HttpResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { concat, filter, get, has, includes, map, set, sortBy, cloneDeep } from 'lodash';
import { MockProvider } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { map as rxjsMap, tap } from 'rxjs/operators';
import { ElementRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CATALOG, DCTERMS, OWL, RDF, RDFS, SKOS, XSD } from '../../prefixes';
import { Difference } from '../models/difference.class';
import { HierarchyNode } from '../models/hierarchyNode.interface';
import { VocabularyStuff } from '../models/vocabularyStuff.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { OntologyListItem } from '../models/ontologyListItem.class';
import { CatalogManagerService } from './catalogManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { Hierarchy } from '../models/hierarchy.interface';
import { OntologyAction } from '../models/ontologyAction';
import { StateManagerService } from './stateManager.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { ToastService } from './toast.service';
import { PolicyManagerService } from './policyManager.service';
import { ManchesterConverterService } from './manchesterConverter.service';
import { PropertyManagerService } from './propertyManager.service';
import { UpdateRefsService } from './updateRefs.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { EventTypeConstants, EventWithPayload } from '../models/eventWithPayload.interface';
import { SettingManagerService } from './settingManager.service';
import { RdfUpload } from '../models/rdfUpload.interface';
import { RdfDownload } from '../models/rdfDownload.interface';
import { VersionedRdfState } from './versionedRdfState.service';
import { OntologyRecordActionI } from './ontologyRecordAction.interface';
import { OntologyStateService } from './ontologyState.service';

class MockElementRef extends ElementRef {
  constructor() {
    super(null);
  }
}

describe('Ontology State Service', function() {
  let service: OntologyStateService;
  let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
  let mergeRequestManagerServiceStub: jasmine.SpyObj<MergeRequestManagerService>;
  let snackBarStub: jasmine.SpyObj<MatSnackBar>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
  let updateRefsStub: jasmine.SpyObj<UpdateRefsService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let manchesterConverterStub: jasmine.SpyObj<ManchesterConverterService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
  let _catalogManagerActionSubject: Subject<EventWithPayload>;
  let _mergeRequestManagerActionSubject: Subject<EventWithPayload>;

  const file = new File([''], '');
  const error = 'Error message';
  const catalogId = 'catalogId';
  const recordId = 'recordId';
  const branchId = 'branchId';
  const commitId = 'commitId';
  const tagId = 'tagId';
  const ontologyId = 'ontologyId';
  const classId = 'https://test.com#classId';
  const ontologyPropertyId = 'objectPropertyId';
  const datatypeId = 'datatypeId';
  const annotationId = 'annotationId';
  const dataPropertyId = 'dataPropertyId';
  const individualId = 'individualId';
  const conceptId = 'conceptId';
  const conceptSchemeId = 'conceptSchemeId';
  const semanticRelationId = 'semanticRelationId';
  const title = 'title';
  const difference: Difference = new Difference([{'@id': 'add'}], [{'@id': 'del'}]);
  const uploadResponse = { ontologyId, recordId, branchId, commitId };
  const branch: JSONLDObject = {
    '@id': branchId,
    [`${CATALOG}head`]: [{'@id': commitId}],
    [`${DCTERMS}title`]: [{'@value': 'MASTER'}]
  };
  const hierarchyNode: HierarchyNode = {
    entityIRI: '',
    hasChildren: false,
    indent: 0,
    path: [],
    entityInfo: {
      label: '',
      names: []
    },
    joinedPath: ''
  };
  const ontologyObj: JSONLDObject = {
    '@id': ontologyId,
    '@type': [`${OWL}Ontology`]
  };
  const classObj: JSONLDObject = {
    '@id': classId,
    '@type': [`${OWL}Class`]
  };
  const individualObj: JSONLDObject = {
    '@id': individualId,
    '@type': [`${OWL}NamedIndividual`, classId]
  };
  const onActionSpy = jasmine.createSpy('onAction').and.returnValue(of(null));
  const afterDismissedSpy = jasmine.createSpy('afterDismissed').and.returnValue(of(null));
  
  let listItem: OntologyListItem;
  let hierarchyInfo: Hierarchy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        OntologyStateService,
        MockProvider(CatalogManagerService),
        MockProvider(OntologyManagerService),
        MockProvider(StateManagerService),
        MockProvider(MergeRequestManagerService),
        MockProvider(ProgressSpinnerService),
        { provide: MatSnackBar, useFactory: () => jasmine.createSpyObj('MatSnackBar', {
          open: {
            onAction: onActionSpy,
            afterDismissed: afterDismissedSpy
          }
        }) },
        MockProvider(PropertyManagerService),
        MockProvider(UpdateRefsService),
        MockProvider(PolicyManagerService),
        MockProvider(PolicyEnforcementService),
        MockProvider(ManchesterConverterService),
        MockProvider(ToastService),
        MockProvider(SettingManagerService),
        { provide: ElementRef, useClass: MockElementRef }
      ]
    });
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
    ontologyManagerStub.uploadOntology.and.returnValue(of(uploadResponse));
    mergeRequestManagerServiceStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    snackBarStub = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    updateRefsStub = TestBed.inject(UpdateRefsService) as jasmine.SpyObj<UpdateRefsService>;
    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    manchesterConverterStub = TestBed.inject(ManchesterConverterService) as jasmine.SpyObj<ManchesterConverterService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
      
    _catalogManagerActionSubject = new Subject<EventWithPayload>();
    _mergeRequestManagerActionSubject = new Subject<EventWithPayload>();
    catalogManagerStub.catalogManagerAction$ = _catalogManagerActionSubject.asObservable();
    mergeRequestManagerServiceStub.mergeRequestAction$ = _mergeRequestManagerActionSubject.asObservable();

    service = TestBed.inject(OntologyStateService);
    
    policyEnforcementStub.permit = 'Permit';
    policyEnforcementStub.deny = 'Deny';
    catalogManagerStub.localCatalog = {'@id': catalogId};
    service.initialize();
    hierarchyInfo = {
      iris: {
        'node1a': ontologyId,
        'node1b': ontologyId,
        'node2a': ontologyId,
        'node2b': ontologyId,
        'node2c': ontologyId,
        'node3a': ontologyId,
        'node3b': ontologyId,
        'node3c': ontologyId,
      },
      parentMap: {
        'node1a': ['node2a', 'node2b', 'node2c'],
        'node1b': ['node3b'],
        'node2a': ['node3a', 'node3c'],
        'node2b': ['node3a'],
        'node2c': ['node3b'],
        'node3b': ['node3a'],
      },
      childMap: {
        'node2a': ['node1a'],
        'node2b': ['node1a'],
        'node2c': ['node1a'],
        'node3a': ['node2a', 'node2b', 'node3b'],
        'node3b': ['node1b', 'node2c'],
        'node3c': ['node2a'],
      },
      circularMap: {
      },
      flat: []
    };
    propertyManagerStub.defaultDatatypes = concat(
      map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => XSD + item),
      map(['langString'], item => RDF + item)
    );
    
    listItem = new OntologyListItem();
    listItem.ontologyId = ontologyId;
    listItem.versionedRdfRecord = {
      title: 'recordTitle',
      recordId,
      commitId,
      branchId
    };
    listItem.iriList = [ontologyId, classId, dataPropertyId];
    listItem.propertyIcons = {
      'iri1': 'icon',
      'iri2': 'icon',
      'iri3': 'icon'
    };
    listItem.classToChildProperties = {
      'class1': ['iri1', 'iri2'],
      'class2': ['iri2', 'iri5'],
      'class3': ['iri3', 'iri4']
    };
    listItem.entityInfo = {
      [ontologyId]: {
        label: 'ontology',
        names: ['ontology'],
        ontologyId: ontologyId
      },
      [classId]: {
        label: 'class',
        names: ['class'],
        ontologyId: ontologyId
      },
      [dataPropertyId]: {
        label: 'data property',
        names: ['data property'],
        ontologyId: ontologyId
      },
    };
  });

  afterEach(function() {
    service = null;
    propertyManagerStub = null;
    ontologyManagerStub = null;
    progressSpinnerStub = null;
    updateRefsStub = null;
    catalogManagerStub = null;
    policyEnforcementStub = null;
    manchesterConverterStub = null;
    toastStub = null;
    settingManagerStub = null;
    listItem = null;
    hierarchyInfo = null;
    snackBarStub = null;
  });

  it('initialize works properly', function() {
    expect((<any> service).catalogId).toEqual(catalogId);
  });
  it('getDefaultNamespace provides the default namespace to be used for new ontologies', fakeAsync(function() {
    settingManagerStub.getDefaultNamespace.and.returnValue(of('ontology'));
    service.getDefaultNamespace().subscribe(value => {
      expect(value).toEqual('ontology');
    });
    tick();
  }));
  describe('getEntityName should return the proper value', function() {
    beforeEach(() => {
      service.listItem = listItem;
    });
    it('when the entityIRI is in the entityInfo', function() {
      listItem.entityInfo = {
        iri: {
          label: 'name',
          names: []
        }
      };
      expect(service.getEntityName('iri')).toBe('name');
    });
    it('when the entityIRI is not in the entityInfo', function() {
      expect(service.getEntityName('iri')).toBe('Iri');
    });
  });
  describe('getIdentifierIRI retrieves the ontology IRI of an OntologyRecord', function() {
    it('if provided JSON-LD', function() {
      expect(service.getIdentifierIRI({
        '@id': 'recordId', 
        [`${CATALOG}trackedIdentifier`]: [{ '@id': 'ontologyIRI' }]
      })).toEqual('ontologyIRI');
    });
    it('from the current listItem', function() {
      service.listItem = listItem;
      service.listItem.ontologyId = 'ontologyIRI';
      expect(service.getIdentifierIRI()).toEqual('ontologyIRI');
    });
  });
  describe('open should call the proper methods', function() {
    beforeEach(function() {
      spyOn(service, 'setSelected').and.returnValue(of(null));
      spyOn(service, 'getActiveEntityIRI').and.returnValue('entityId');
    });
    describe('when getCatalogDetails resolves', function() {
      beforeEach(function() {
          spyOn(service, 'getCatalogDetails').and.returnValue(of({
            recordId,
            branchId,
            commitId,
            tagId,
            upToDate: true,
            inProgressCommit: difference,
          }));
      });
      it('and createOntologyListItem resolves', fakeAsync(function() {
        spyOn(service, 'createOntologyListItem').and.returnValue(of(listItem));
        service.open({recordId, title, identifierIRI: ontologyId})
          .subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, true, title);
        expect(service.listItem).toEqual(listItem);
        expect(service.list).toContain(listItem);
        expect(service.getActiveEntityIRI).toHaveBeenCalledWith(listItem);
        expect(service.setSelected).toHaveBeenCalledWith('entityId', false, listItem);
      }));
      it('and createOntologyListItem rejects', fakeAsync(function() {
        spyOn(service, 'createOntologyListItem').and.returnValue(throwError(error));
        service.open({recordId, title, identifierIRI: ontologyId})
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, true, title);
        expect(service.listItem).toBeUndefined();
        expect(service.list).toEqual([]);
        expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
        expect(service.setSelected).not.toHaveBeenCalled();
      }));
    });
    it('and getCatalogDetails rejects', fakeAsync(function() {
      spyOn(service, 'getCatalogDetails').and.returnValue(throwError(error));
      service.open({recordId, title, identifierIRI: ontologyId})
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
    }));
  });
  describe('create makes a new ontology without opening it', function() {
    it('unless no file or JSON-LD was provided', fakeAsync(function() {
      service.create({ title: '' }).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(ontologyManagerStub.uploadOntology).not.toHaveBeenCalled();
    }));
    it('if a file is provided', fakeAsync(function() {
      const uploadDetails: RdfUpload = { title: '', file };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails, true);
    }));
    it('if JSON-LD is provided', fakeAsync(function() {
      const uploadDetails: RdfUpload = { title: '', jsonld: [{ '@id': 'shapesGraph' }] };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails, true);
    }));
  });
  describe('createAndOpen calls the correct methods', function() {
    beforeEach(function() {
      spyOn(service, 'setSelected').and.returnValue(of(null));
      spyOn(service, 'getActiveEntityIRI').and.returnValue('entityId');
      service.list = [];
    });
    it('unless no file or JSON-LD was provided', fakeAsync(function() {
      service.createAndOpen({title: ''}).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(ontologyManagerStub.uploadOntology).not.toHaveBeenCalled();
    }));
    describe('if a file was provided', function() {
      const uploadDetails: RdfUpload = { title, description: 'description', keywords: ['A', 'B'], file };
      describe('when uploadOntology succeeds', function() {
        describe('and createOntologyListItem succeeds', function() {
          beforeEach(function() {
            spyOn(service, 'createOntologyListItem').and.returnValue(of(listItem));
          });
          it('and createState resolves', fakeAsync(function() {
            spyOn(service, 'createState').and.returnValue(of(null));
            service.createAndOpen(uploadDetails)
              .subscribe(response => {
                expect(response).toEqual({
                  recordId,
                  branchId,
                  commitId,
                  ontologyId,
                  title: listItem.versionedRdfRecord.title
                });
              }, () => fail('Observable should have resolved'));
            tick();
            expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
            expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, title);
            expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
            expect(service.list.length).toBe(1);
            expect(service.listItem).toEqual(listItem);
            expect(service.setSelected).toHaveBeenCalledWith('entityId', false, service.listItem);
          }));
          it('and createState rejects', fakeAsync(function() {
            spyOn(service, 'createState').and.returnValue(throwError(error));
            service.createAndOpen({ title, description: 'description', keywords: ['A', 'B'], file })
              .subscribe(() => fail('Observable should have rejected'), response => {
                expect(response).toEqual(error);
              });
            tick();
            expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
            expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, title);
            expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
            expect(service.list.length).toBe(0);
            expect(service.listItem).toBeUndefined();
            expect(service.setSelected).not.toHaveBeenCalled();
          }));
        });
        it('when createOntologyListItem rejects', fakeAsync(function() {
          spyOn(service, 'createOntologyListItem').and.returnValue(throwError(error));
          spyOn(service, 'createState');
          service.createAndOpen(uploadDetails)
            .subscribe(() => fail('Observable should have rejected'), response => {
              expect(response).toEqual(error);
            });
          tick();
          expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
          expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, title);
          expect(service.createState).not.toHaveBeenCalled();
          expect(service.list.length).toBe(0);
          expect(service.listItem).toBeUndefined();
          expect(service.setSelected).not.toHaveBeenCalled();
        }));
      });
      it('when uploadOntology rejects', fakeAsync(function() {
        spyOn(service, 'createOntologyListItem');
        spyOn(service, 'createState');
        ontologyManagerStub.uploadOntology.and.returnValue(throwError(error));
        service.createAndOpen(uploadDetails)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
        expect(service.createOntologyListItem).not.toHaveBeenCalled();
        expect(service.createState).not.toHaveBeenCalled();
        expect(service.list.length).toBe(0);
        expect(service.listItem).toBeUndefined();
        expect(service.setSelected).not.toHaveBeenCalled();
      }));
    });
    describe('if JSON-LD was provided', function() {
      const uploadDetails: RdfUpload = { title, description: 'description', keywords: ['A', 'B'], jsonld: [ontologyObj] };
      beforeEach(function() {
        spyOn(service, 'createOntologyListItem');
      });
      describe('when uploadOntology succeeds', function() {
        it('and createState resolves', fakeAsync(function() {
          spyOn(service, 'createState').and.returnValue(of(null));
          service.createAndOpen(uploadDetails)
            .subscribe(response => {
              expect(response).toEqual({
                recordId,
                branchId,
                commitId,
                ontologyId,
                title
              });
            }, () => fail('Observable should have resolved'));
          tick();
          expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
          expect(service.createOntologyListItem).not.toHaveBeenCalled();
          expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
          expect(service.list.length).toBe(1);
          expect(service.listItem).toBeDefined();
          expect(service.listItem.ontologyId).toEqual(ontologyId);
          expect(service.listItem.editorTabStates.project.entityIRI).toEqual(ontologyId);
          expect(service.listItem.masterBranchIri).toEqual(branchId);
          expect(service.listItem.userCanModify).toBeTrue();
          expect(service.listItem.userCanModifyMaster).toBeTrue();
          expect(service.setSelected).toHaveBeenCalledWith('entityId', false, service.listItem);
        }));
        it('and createState rejects', fakeAsync(function() {
          spyOn(service, 'createState').and.returnValue(throwError(error));
          service.createAndOpen(uploadDetails)
            .subscribe(() => fail('Observable should have rejected'), response => {
              expect(response).toEqual(error);
            });
          tick();
          expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
          expect(service.createOntologyListItem).not.toHaveBeenCalled();
          expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
          expect(service.list.length).toBe(0);
          expect(service.listItem).toBeUndefined();
          expect(service.setSelected).not.toHaveBeenCalled();
        }));
      });
      it('when uploadOntology rejects', fakeAsync(function() {
        spyOn(service, 'createState');
        ontologyManagerStub.uploadOntology.and.returnValue(throwError(error));
        service.createAndOpen(uploadDetails)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(ontologyManagerStub.uploadOntology).toHaveBeenCalledWith(uploadDetails);
        expect(service.createOntologyListItem).not.toHaveBeenCalled();
        expect(service.createState).not.toHaveBeenCalled();
        expect(service.list.length).toBe(0);
        expect(service.listItem).toBeUndefined();
        expect(service.setSelected).not.toHaveBeenCalled();
      }));
    });
  });
  describe('delete deletes a shapes graph', function() {
    beforeEach(function() {
      this.deleteStateSpy = spyOn(service, 'deleteState').and.returnValue(of(null));
    });
    describe('first deleting the state', function() {
      describe('then deleting the record', function() {
        it('successfully', async function() {
          catalogManagerStub.deleteRecord.and.returnValue(of(null));
          await service.delete(recordId)
            .subscribe(() => {}, () => fail('Observable should have succeeded'));
          expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(recordId, catalogId);
        });
        it('unless an error occurs', async function() {
          catalogManagerStub.deleteRecord.and.returnValue(throwError(error));
          await service.delete(recordId)
            .subscribe(() => {
              fail('Observable should have rejected');
            }, response => {
              expect(response).toEqual(error);
            });
          expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(recordId, catalogId);
        });
      });
      it('unless an error occurs', async function() {
        this.deleteStateSpy.and.returnValue(throwError(error));
        await service.delete(recordId)
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual(error);
          });
        expect(this.deleteStateSpy).toHaveBeenCalledWith(recordId);
        expect(catalogManagerStub.deleteRecord).not.toHaveBeenCalled();
      });
    });
  });
  it('download submits a download of a shapes graph record', function() {
    const rdfDownload: RdfDownload = {
      recordId,
      branchId,
      commitId,
      rdfFormat: 'jsonld',
      fileName: 'fileName'
    };
    service.download(rdfDownload);
    expect(ontologyManagerStub.downloadOntology).toHaveBeenCalledWith(
      recordId,
      branchId,
      commitId,
      'jsonld',
      'fileName'
    );
  });
  describe('removeChanges should call the proper methods', function() {
    beforeEach(function() {
      service.listItem = listItem;
      spyOn(service, 'resetStateTabs').and.returnValue(of(null));
    });
    describe('when deleteInProgressCommit succeeds', function() {
      beforeEach(function() {
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
      });
      it('and changeVersion succeeds', fakeAsync(function() {
        spyOn(service, 'changeVersion').and.returnValue(of(null));
        service.removeChanges().subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.resetStateTabs).toHaveBeenCalledWith();
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, listItem.upToDate, true, listItem.changesPageOpen);
      }));
      it('and changeVersion rejects', fakeAsync(function() {
        spyOn(service, 'changeVersion').and.returnValue(throwError(error));
        service.removeChanges().subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.resetStateTabs).toHaveBeenCalledWith();
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, listItem.upToDate, true, listItem.changesPageOpen);
      }));
    });
    it('when deleteInProgressCommit rejects', fakeAsync(function() {
      spyOn(service, 'changeVersion');
      catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(error));
      service.removeChanges().subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
      });
      tick();
      expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
      expect(service.resetStateTabs).not.toHaveBeenCalled();
      expect(service.changeVersion).not.toHaveBeenCalled();
    }));
  });
  describe('uploadChanges should call the proper methods', function() {
    beforeEach(function() {
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
    });
    describe('when uploadChangesFile resolves', function() {
      beforeEach(function() {
        ontologyManagerStub.uploadChangesFile.and.returnValue(of(null));
      });
      it('and getInProgressCommit resolves', fakeAsync(function() {
        catalogManagerStub.getInProgressCommit.and.returnValue(of(difference));
        spyOn(service, 'changeVersion').and.returnValue(of(null));
        listItem.upToDate = true;
        service.uploadChanges({file, recordId, branchId, commitId}).subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(ontologyManagerStub.uploadChangesFile).toHaveBeenCalledWith(file, recordId, branchId, commitId);
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        expect(listItem.inProgressCommit).toEqual(difference);
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, true, false, listItem.changesPageOpen);
      }));
      it('and getInProgressCommit rejects', fakeAsync(function() {
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(error));
        spyOn(service, 'changeVersion');
        listItem.upToDate = true;
        service.uploadChanges({file, recordId, branchId, commitId}).subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual({ errorMessage: error, errorDetails: [  ] });
        });
        tick();
        expect(ontologyManagerStub.uploadChangesFile).toHaveBeenCalledWith(file, recordId, branchId, commitId);
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.getListItemByRecordId).not.toHaveBeenCalled();
        expect(service.changeVersion).not.toHaveBeenCalled();
      }));
    });
    it('when uploadChangesFile rejects', fakeAsync(function() {
      ontologyManagerStub.uploadChangesFile.and.returnValue(throwError(error));
      spyOn(service, 'changeVersion');
      service.uploadChanges({file, recordId, branchId, commitId}).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual({ errorMessage: error, errorDetails: [  ] });
      });
      tick();
      expect(ontologyManagerStub.uploadChangesFile).toHaveBeenCalledWith(file, recordId, branchId, commitId);
      expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
      expect(service.getListItemByRecordId).not.toHaveBeenCalled();
      expect(service.changeVersion).not.toHaveBeenCalled();
    }));
  });
  describe('changeVersion should call the proper methods when', function() {
    beforeEach(function() {
        spyOn(service, 'resetStateTabs').and.returnValue(of(null));
        this.oldListItem = cloneDeep(listItem);
        this.oldListItem.tabIndex = 1;
        this.oldListItem.inProgressCommit = difference;
        spyOn(service, 'getListItemByRecordId').and.returnValue(this.oldListItem);
    });
    describe('updateState resolves', function() {
      beforeEach(function() {
        spyOn(service, 'updateState').and.returnValue(of(null));
      });
      describe('and createOntologyListItem resolves', function() {
        beforeEach(function() {
          spyOn(service, 'createOntologyListItem').and.returnValue(of(listItem));
        });
        it('and the in progress commit should be cleared with the same version title', fakeAsync(function() {
          spyOn(service, 'getActiveKey').and.returnValue('key');
          const versionTitle = this.oldListItem.currentVersionTitle;
          service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, true, true)
            .subscribe(() => {}, () => fail('Observable should have resolved'));
          tick();
          expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
          expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, new Difference(), listItem.upToDate, listItem.versionedRdfRecord.title);
          expect(service.resetStateTabs).toHaveBeenCalledWith(listItem);
          expect(this.oldListItem.tabIndex).toEqual(1);
          expect(this.oldListItem.changesPageOpen).toBeTrue();
          expect(this.oldListItem.currentVersionTitle).toEqual(versionTitle);
        }));
        it('and the in progress commit should not be cleared with a new version title', fakeAsync(function() {
          spyOn(service, 'getActiveKey').and.returnValue('key');
          service.changeVersion(recordId, branchId, commitId, tagId, 'New Title', listItem.upToDate, false, false)
            .subscribe(() => {}, () => fail('Observable should have resolved'));
          tick();
          expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
          expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
          expect(service.resetStateTabs).toHaveBeenCalledWith(listItem);
          expect(this.oldListItem.tabIndex).toEqual(1);
          expect(this.oldListItem.changesPageOpen).toBeFalse();
          expect(this.oldListItem.currentVersionTitle).toEqual('New Title');
        }));
        describe('and the ontology is no longer a vocabulary', function() {
          it('and the ontology was open to concepts or schemes', fakeAsync(function() {
            spyOn(service, 'getActiveKey').and.returnValue('concepts');
            listItem.isVocabulary = false;
            this.oldListItem.ontologyId = 'old';
            service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, false, false)
              .subscribe(() => {}, () => fail('Observable should have resolved'));
            tick();
            expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
            expect(service.resetStateTabs).toHaveBeenCalledWith(listItem);
            expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
            expect(this.oldListItem.tabIndex).toEqual(0);
          }));
          it('and the ontology was not open to concepts or schemes', fakeAsync(function() {
            spyOn(service, 'getActiveKey').and.returnValue('overview');
            listItem.isVocabulary = false;
            this.oldListItem.ontologyId = 'old';
            service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, false, false)
              .subscribe(() => {}, () => fail('Observable should have resolved'));
            tick();
            expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
            expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
            expect(service.resetStateTabs).toHaveBeenCalledWith(listItem);
            expect(this.oldListItem.tabIndex).toEqual(1);
          }));
        });
      });
      it('and createOntologyListItem rejects', fakeAsync(function() {
        spyOn(service, 'createOntologyListItem').and.returnValue(throwError(error));
        service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, false, false)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
        expect(service.createOntologyListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
      }));
    });
    it('and updateState rejects', fakeAsync(function() {
      this.oldListItem.ontologyId = 'old';
      spyOn(service, 'updateState').and.returnValue(throwError(error));
      spyOn(service, 'createOntologyListItem');
      service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, false, false)
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
      expect(service.createOntologyListItem).not.toHaveBeenCalled();
      expect(service.resetStateTabs).not.toHaveBeenCalled();
    }));
  });
  it('attemptMerge should perform additional actions when attempting a merge', fakeAsync(function() {
    spyOn(service, 'resetStateTabs').and.returnValue(of(null));
    spyOn(VersionedRdfState.prototype, 'attemptMerge').and.returnValue(of(null));
    service.listItem = listItem;
    service.attemptMerge().subscribe(() => {
      expect(VersionedRdfState.prototype.attemptMerge).toHaveBeenCalledWith();
      expect(service.resetStateTabs).toHaveBeenCalledWith();
    });
    tick();
  }));
  describe('merge should correctly return and call the correct methods if mergeBranches', function() {
    beforeEach(function() {
      service.list = [listItem]
      service.listItem = listItem;
      service.listItem.merge = {
        active: true,
        target: { '@id': branchId, [`${DCTERMS}title`]: [{ '@value': 'Branch Title' }] },
        checkbox: true,
        difference,
        resolutions: difference,
        conflicts: [],
        startIndex: 0
      };
      spyOn(service, 'resetStateTabs').and.returnValue(of(null));
    });
    describe('resolves and changeVersion', function() {
      beforeEach(function() {
        catalogManagerStub.mergeBranches.and.returnValue(of(commitId));
      });
      describe('resolves and merge checkbox is', function() {
        beforeEach(function() {
          spyOn(service, 'changeVersion').and.returnValue(of(null));
        });
        describe('true and deleteRecordBranch', function() {
          beforeEach(function() {
            spyOn(service, 'deleteBranchState').and.returnValue(of(null));
          });
          it('resolves', fakeAsync(function() {
            catalogManagerStub.deleteRecordBranch.and.callFake((recordId: string, branchId: string, catalogId: string) => {
              return of(1).pipe(
                rxjsMap(() => {}),
                tap(() => {
                  _catalogManagerActionSubject.next({
                    eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL, 
                    payload: {
                      recordId, 
                      branchId,
                      catalogId
                    }
                  });
                })
              );
            });
            service.merge().subscribe(() => {}, () => fail('Observable should have resolved'));
            tick();
            expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId, service.listItem.merge.resolutions, []);
            expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, 'Branch Title', true, false, false);
            expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
            expect(service.deleteBranchState).toHaveBeenCalledWith(recordId, branchId);
            expect(service.resetStateTabs).toHaveBeenCalledWith();
          }));
          it('rejects', fakeAsync(function() {
            catalogManagerStub.deleteRecordBranch.and.returnValue(throwError(error));
            service.merge()
              .subscribe(() => fail('Observable should have rejected'), response => {
                expect(response).toEqual(error);
              });
            tick();
            expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId, service.listItem.merge.resolutions, []);
            expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, 'Branch Title', true, false, false);
            expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith(recordId, branchId, catalogId);
            expect(service.deleteBranchState).not.toHaveBeenCalled();
            expect(service.resetStateTabs).not.toHaveBeenCalledWith();
          }));
        });
        it('false', fakeAsync(function() {
          service.listItem.merge.checkbox = false;
          spyOn(service, 'deleteBranchState');
          service.merge()
            .subscribe(() => {}, () => fail('Observable should have resolved'));
          tick();
          expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId, service.listItem.merge.resolutions, []);
          expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, 'Branch Title', true, false, false);
          expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
          expect(service.deleteBranchState).not.toHaveBeenCalled();
          expect(service.resetStateTabs).toHaveBeenCalledWith();
        }));
      });
      it('rejects', fakeAsync(function() {
        spyOn(service, 'changeVersion').and.returnValue(throwError(error));
        spyOn(service, 'deleteBranchState');
        service.merge()
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId, service.listItem.merge.resolutions, []);
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, 'Branch Title', true, false, false);
        expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
        expect(service.deleteBranchState).not.toHaveBeenCalled();
        expect(service.resetStateTabs).not.toHaveBeenCalledWith();
      }));
    });
    it('rejects', fakeAsync(function() {
      spyOn(service, 'deleteBranchState');
      spyOn(service, 'changeVersion');
      catalogManagerStub.mergeBranches.and.returnValue(throwError(error));
      service.merge()
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(branchId, branchId, recordId, catalogId, service.listItem.merge.resolutions, []);
      expect(service.changeVersion).not.toHaveBeenCalled();
      expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
      expect(service.deleteBranchState).not.toHaveBeenCalled();
      expect(service.resetStateTabs).not.toHaveBeenCalledWith();
    }));
  });
  it('createState should perform additional actions when creating state', fakeAsync(function() {
    spyOn(VersionedRdfState.prototype, 'createState').and.returnValue(of(null));
    service.ontologyRecordAction$.subscribe(value => {
      expect(value).toEqual({ recordId, action: OntologyAction.UPDATE_STATE});
    });
    service.createState({ recordId, commitId }).subscribe(() => {
      expect(VersionedRdfState.prototype.createState).toHaveBeenCalledWith({ recordId, commitId });
    });
    tick();
  }));
  it('updateState should perform additional actions when creating state', fakeAsync(function() {
    spyOn(VersionedRdfState.prototype, 'updateState').and.returnValue(of(null));
    service.ontologyRecordAction$.subscribe(value => {
      expect(value).toEqual({ recordId, action: OntologyAction.UPDATE_STATE});
    });
    service.updateState({ recordId, commitId }).subscribe(() => {
      expect(VersionedRdfState.prototype.updateState).toHaveBeenCalledWith({ recordId, commitId });
    });
    tick();
  }));
  it('close removes the correct object from the list', function() {
    spyOn(service, 'emitOntologyAction');
    service.list = [listItem];
    service.close(recordId);
    expect(service.list).toEqual([]);
    expect(service.listItem).toBeUndefined();
    expect(service.emitOntologyAction).toHaveBeenCalledWith({action: OntologyAction.ONTOLOGY_CLOSE, recordId});
  });
  it('emitOntologyAction sends an action to the observable', fakeAsync(function() {
    const action: OntologyRecordActionI = {
      action: OntologyAction.ONTOLOGY_CLOSE,
      recordId
    };
    service.ontologyRecordAction$.subscribe(value => {
      expect(value).toEqual(action);
    });
    service.emitOntologyAction(action);
    tick();
  }));
  describe('createOntologyListItem should call the correct functions', function() {
    const classId2 = `${SKOS}Concept`;
    const dataPropertyId2 = 'dataPropertyId2';
    const ontologyPropertyId2 = 'objectProperty2';
    const datatypeId2 = 'datatypeId2';
    const annotationId2 = 'annotationId2';
    const individualId2 = 'individualId2';
    const conceptId2 = 'conceptId2';
    const conceptSchemeId2 = 'conceptSchemeId2';
    const userBranchId = 'userBranchId';
    const ontologyId2 = 'ontologyId2';
    const userBranch: JSONLDObject = {
      '@id': userBranchId,
      [`${CATALOG}createdFrom`]: [{ '@id': branchId }]
    };
    beforeEach(function() {
      ontologyManagerStub.getOntologyStuff.and.returnValue(of({
        propertyToRanges: {},
        concepts: [conceptId],
        conceptSchemes: [conceptSchemeId],
        derivedConcepts: [],
        derivedConceptSchemes: [],
        derivedSemanticRelations: [],
        importedIRIs: [{
          id: ontologyId2,
          annotationProperties: [annotationId2],
          deprecatedIris: [],
          classes: [classId2],
          datatypes: [datatypeId2],
          dataProperties: [dataPropertyId2],
          objectProperties: [ontologyPropertyId2],
          namedIndividuals: [individualId2],
          concepts: [conceptId2],
          conceptSchemes: [conceptSchemeId2],
          derivedConcepts: [],
          derivedConceptSchemes: [],
          derivedSemanticRelations: []
        }],
        conceptHierarchy: {parentMap: {}, childMap: {}, circularMap: {}},
        conceptSchemeHierarchy: {parentMap: {}, childMap: {}, circularMap: {}},
        ontologyIRI: ontologyId,
        iriList: {
          annotationProperties: [annotationId],
          deprecatedIris: [],
          classes: [classId],
          datatypes: [datatypeId],
          objectProperties: [ontologyPropertyId],
          dataProperties: [dataPropertyId],
          namedIndividuals: [individualId],
          concepts: [conceptId],
          conceptSchemes: [conceptSchemeId],
          derivedConcepts: [classId],
          derivedConceptSchemes: [classId],
          derivedSemanticRelations: [semanticRelationId]
        },
        importedOntologies: [{ontologyId: ontologyId2, id: 'id'}],
        failedImports: ['failedId'],
        classHierarchy: {parentMap: {}, childMap: {}, circularMap: {}},
        classesWithIndividuals: {},
        dataPropertyHierarchy: {parentMap: {}, childMap: {}, circularMap: {}},
        objectPropertyHierarchy: {parentMap: {}, childMap: {}, circularMap: {}},
        annotationHierarchy: {parentMap: {}, childMap: {}, circularMap: {}},
        individuals: {ClassA: ['IndivA1', 'IndivA2']},
        classToAssociatedProperties: {},
        noDomainProperties: [],
        entityNames: undefined
      }));
      this.branches = [branch, userBranch];
      catalogManagerStub.isUserBranch.and.callFake(branch => {
        if (branch['@id'] === branchId) {
          return false;
        } else if (branch['@id'] === userBranchId) {
          return true;
        }
      });
      catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: this.branches})));
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
      spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
      spyOn(service, 'createFlatEverythingTree').and.returnValue([hierarchyNode]);
      spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
      spyOn(service, 'getIndividualsParentPath').and.returnValue(['ClassA']);
    });
    describe('when all promises resolve', function() {
      it('and it is not a userBranch', fakeAsync(function() {
        service.createOntologyListItem(recordId, branchId, commitId, tagId, difference, false, '')
          .subscribe(response => {
            expect(response.versionedRdfRecord).toEqual({
              title: '',
              recordId,
              branchId,
              commitId,
              tagId
            });
            let expectedIriObj = {};
            expectedIriObj[annotationId] = ontologyId;
            expectedIriObj[annotationId2] = ontologyId2;
            expect(get(response, 'annotations.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[classId] = ontologyId;
            expectedIriObj[classId2] = ontologyId2;
            expect(get(response, 'classes.iris')).toEqual(expectedIriObj);
            expect(response.isVocabulary).toEqual(true);
            expectedIriObj = {};
            expectedIriObj[dataPropertyId] = ontologyId;
            expectedIriObj[dataPropertyId2] = ontologyId2;
            expect(get(response, 'dataProperties.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[ontologyPropertyId] = ontologyId;
            expectedIriObj[ontologyPropertyId2] = ontologyId2;
            expect(get(response, 'objectProperties.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[individualId] = ontologyId;
            expectedIriObj[individualId2] = ontologyId2;
            expect(get(response, 'individuals.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[conceptId] = ontologyId;
            expectedIriObj[conceptId2] = ontologyId2;
            expect(get(response, 'concepts.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[conceptSchemeId] = ontologyId;
            expectedIriObj[conceptSchemeId2] = ontologyId2;
            expect(get(response, 'conceptSchemes.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[datatypeId] = ontologyId;
            expectedIriObj[datatypeId2] = ontologyId2;
            expect(get(response, 'dataPropertyRange')).toEqual(jasmine.objectContaining(expectedIriObj));
            expect(get(response, 'derivedConcepts')).toEqual([classId]);
            expect(get(response, 'derivedConceptSchemes')).toEqual([classId]);
            expect(get(response, 'derivedSemanticRelations')).toEqual([semanticRelationId]);
            expect(get(response, 'classes.parentMap')).toEqual({});
            expect(get(response, 'classes.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.classes, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'classes.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
            expect(get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
            expect(service.getIndividualsParentPath).toHaveBeenCalledWith(response);
            expect(get(response, 'individualsParentPath')).toEqual(['ClassA']);
            expect(get(response, 'dataProperties.parentMap')).toEqual({});
            expect(get(response, 'dataProperties.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'dataProperties.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'objectProperties.parentMap')).toEqual({});
            expect(get(response, 'objectProperties.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'objectProperties.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'annotations.parentMap')).toEqual({});
            expect(get(response, 'annotations.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.annotations, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'annotations.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'concepts.parentMap')).toEqual({});
            expect(get(response, 'concepts.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.concepts, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'concepts.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'conceptSchemes.parentMap')).toEqual({});
            expect(get(response, 'conceptSchemes.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'conceptSchemes.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'upToDate')).toBe(false);
            expect(get(response, 'iriList').sort()).toEqual([ontologyId, ontologyId2, annotationId, classId, datatypeId, ontologyPropertyId, dataPropertyId, individualId, conceptId, conceptSchemeId, semanticRelationId, annotationId2, classId2, dataPropertyId2, ontologyPropertyId2, individualId2, datatypeId2, conceptId2, conceptSchemeId2].sort());
            expect(service.createFlatEverythingTree).toHaveBeenCalledWith(response);
            expect(get(response, 'flatEverythingTree')).toEqual([hierarchyNode]);
            expect(service.createFlatIndividualTree).toHaveBeenCalledWith(response);
            expect(get(response, 'individuals.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'failedImports')).toEqual(['failedId']);
            expect(get(response, 'importedOntologyIds')).toEqual(['id']);
            expect(get(response, 'importedOntologies')).toEqual([{
              id: 'id',
              ontologyId: ontologyId2
            }]);
            expect(get(response, 'userBranch')).toEqual(false);
            expect(get(response, 'createdFromExists')).toEqual(true);
            expect(get(response, 'masterBranchIri')).toEqual(branchId);
            expect(get(response, 'userCanModify')).toEqual(true);
            expect(get(response, 'userCanModifyMaster')).toEqual(true);
            expect(get(response, 'entityInfo')).toEqual({
              [ontologyId]: {
                label: 'Ontology Id', 
                names: [], 
                ontologyId: 'ontologyId',
                imported: false
              },
              [annotationId]: {
                label: 'Annotation Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [classId]: {
                label: 'Class Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [datatypeId]: {
                label: 'Datatype Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [ontologyPropertyId]: {
                label: 'Object Property Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [dataPropertyId]: {
                label: 'Data Property Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [individualId]: {
                label: 'Individual Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [conceptId]: {
                label: 'Concept Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [conceptSchemeId]: {
                label: 'Concept Scheme Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [annotationId2]: {
                label: 'Annotation Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [classId2]: {
                label: 'Concept',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [dataPropertyId2]: {
                label: 'Data Property Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [ontologyPropertyId2]: {
                label: 'Object Property 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [individualId2]: {
                label: 'Individual Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [datatypeId2]: {
                label: 'Datatype Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [conceptId2]: {
                label: 'Concept Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [conceptSchemeId2]: {
                label: 'Concept Scheme Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
            });
          }, () => fail('Observable should have resolved'));
        tick();
        expect(ontologyManagerStub.getOntologyStuff).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
      }));
      it('and it is a userBranch', fakeAsync(function() {
        service.createOntologyListItem(recordId, userBranchId, commitId, tagId, difference, false, '')
          .subscribe(response => {
            expect(response.versionedRdfRecord).toEqual({
              title: '',
              recordId,
              branchId: 'userBranchId',
              commitId,
              tagId
            });
            let expectedIriObj = {};
            expectedIriObj[annotationId] = ontologyId;
            expectedIriObj[annotationId2] = ontologyId2;
            expect(get(response, 'annotations.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[classId] = ontologyId;
            expectedIriObj[classId2] = ontologyId2;
            expect(get(response, 'classes.iris')).toEqual(expectedIriObj);
            expect(response.isVocabulary).toEqual(true);
            expectedIriObj = {};
            expectedIriObj[dataPropertyId] = ontologyId;
            expectedIriObj[dataPropertyId2] = ontologyId2;
            expect(get(response, 'dataProperties.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[ontologyPropertyId] = ontologyId;
            expectedIriObj[ontologyPropertyId2] = ontologyId2;
            expect(get(response, 'objectProperties.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[individualId] = ontologyId;
            expectedIriObj[individualId2] = ontologyId2;
            expect(get(response, 'individuals.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[conceptId] = ontologyId;
            expectedIriObj[conceptId2] = ontologyId2;
            expect(get(response, 'concepts.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[conceptSchemeId] = ontologyId;
            expectedIriObj[conceptSchemeId2] = ontologyId2;
            expect(get(response, 'conceptSchemes.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[datatypeId] = ontologyId;
            expectedIriObj[datatypeId2] = ontologyId2;
            expect(get(response, 'dataPropertyRange')).toEqual(jasmine.objectContaining(expectedIriObj));
            expect(get(response, 'derivedConcepts')).toEqual([classId]);
            expect(get(response, 'derivedConceptSchemes')).toEqual([classId]);
            expect(get(response, 'derivedSemanticRelations')).toEqual([semanticRelationId]);
            expect(get(response, 'classes.parentMap')).toEqual({});
            expect(get(response, 'classes.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.classes, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'classes.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
            expect(get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
            expect(service.getIndividualsParentPath).toHaveBeenCalledWith(response);
            expect(get(response, 'individualsParentPath')).toEqual(['ClassA']);
            expect(get(response, 'dataProperties.parentMap')).toEqual({});
            expect(get(response, 'dataProperties.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'dataProperties.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'objectProperties.parentMap')).toEqual({});
            expect(get(response, 'objectProperties.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'objectProperties.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'annotations.parentMap')).toEqual({});
            expect(get(response, 'annotations.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.annotations, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'annotations.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'concepts.parentMap')).toEqual({});
            expect(get(response, 'concepts.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.concepts, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'concepts.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'conceptSchemes.parentMap')).toEqual({});
            expect(get(response, 'conceptSchemes.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'conceptSchemes.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'upToDate')).toBe(false);
            expect(get(response, 'iriList').sort()).toEqual([ontologyId, ontologyId2, annotationId, classId, datatypeId, ontologyPropertyId, dataPropertyId, individualId, conceptId, conceptSchemeId, semanticRelationId, annotationId2, classId2, dataPropertyId2, ontologyPropertyId2, individualId2, datatypeId2, conceptId2, conceptSchemeId2].sort());
            expect(service.createFlatEverythingTree).toHaveBeenCalledWith(response);
            expect(get(response, 'flatEverythingTree')).toEqual([hierarchyNode]);
            expect(service.createFlatIndividualTree).toHaveBeenCalledWith(response);
            expect(get(response, 'individuals.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'failedImports')).toEqual(['failedId']);
            expect(get(response, 'importedOntologyIds')).toEqual(['id']);
            expect(get(response, 'importedOntologies')).toEqual([{
              id: 'id',
              ontologyId: ontologyId2
            }]);
            expect(get(response, 'userBranch')).toEqual(true);
            expect(get(response, 'createdFromExists')).toEqual(true);
            expect(get(response, 'masterBranchIri')).toEqual(branchId);
            expect(get(response, 'userCanModify')).toEqual(true);
            expect(get(response, 'userCanModifyMaster')).toEqual(true);
            expect(get(response, 'entityInfo')).toEqual({
              [ontologyId]: {
                label: 'Ontology Id', 
                names: [], 
                ontologyId: 'ontologyId',
                imported: false
              },
              [annotationId]: {
                label: 'Annotation Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [classId]: {
                label: 'Class Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [datatypeId]: {
                label: 'Datatype Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [ontologyPropertyId]: {
                label: 'Object Property Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [dataPropertyId]: {
                label: 'Data Property Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [individualId]: {
                label: 'Individual Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [conceptId]: {
                label: 'Concept Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [conceptSchemeId]: {
                label: 'Concept Scheme Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [annotationId2]: {
                label: 'Annotation Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [classId2]: {
                label: 'Concept',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [dataPropertyId2]: {
                label: 'Data Property Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [ontologyPropertyId2]: {
                label: 'Object Property 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [individualId2]: {
                label: 'Individual Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [datatypeId2]: {
                label: 'Datatype Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [conceptId2]: {
                label: 'Concept Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [conceptSchemeId2]: {
                label: 'Concept Scheme Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
            });
          }, () => fail('Observable should have resolved'));
        tick();
        expect(ontologyManagerStub.getOntologyStuff).toHaveBeenCalledWith(recordId, userBranchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
      }));
      it('and it is a userBranch whose createdFrom branch has been deleted', fakeAsync(function() {
        const branchClone = cloneDeep(userBranch);
        branchClone[`${CATALOG}createdFrom`] = [{ '@id': 'deletedBranchId' }];
        this.branches = [branch, branchClone];
        catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse({body: this.branches})));
        service.createOntologyListItem(recordId, userBranchId, commitId, tagId, difference, false, '')
          .subscribe(response => {
            expect(response.versionedRdfRecord).toEqual({
              title: '',
              recordId,
              branchId: 'userBranchId',
              commitId,
              tagId
            });
            let expectedIriObj = {};
            expectedIriObj[annotationId] = ontologyId;
            expectedIriObj[annotationId2] = ontologyId2;
            expect(get(response, 'annotations.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[classId] = ontologyId;
            expectedIriObj[classId2] = ontologyId2;
            expect(get(response, 'classes.iris')).toEqual(expectedIriObj);
            expect(response.isVocabulary).toEqual(true);
            expectedIriObj = {};
            expectedIriObj[dataPropertyId] = ontologyId;
            expectedIriObj[dataPropertyId2] = ontologyId2;
            expect(get(response, 'dataProperties.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[ontologyPropertyId] = ontologyId;
            expectedIriObj[ontologyPropertyId2] = ontologyId2;
            expect(get(response, 'objectProperties.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[individualId] = ontologyId;
            expectedIriObj[individualId2] = ontologyId2;
            expect(get(response, 'individuals.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[conceptId] = ontologyId;
            expectedIriObj[conceptId2] = ontologyId2;
            expect(get(response, 'concepts.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[conceptSchemeId] = ontologyId;
            expectedIriObj[conceptSchemeId2] = ontologyId2;
            expect(get(response, 'conceptSchemes.iris')).toEqual(expectedIriObj);
            expectedIriObj = {};
            expectedIriObj[datatypeId] = ontologyId;
            expectedIriObj[datatypeId2] = ontologyId2;
            expect(get(response, 'dataPropertyRange')).toEqual(jasmine.objectContaining(expectedIriObj));
            expect(get(response, 'derivedConcepts')).toEqual([classId]);
            expect(get(response, 'derivedConceptSchemes')).toEqual([classId]);
            expect(get(response, 'derivedSemanticRelations')).toEqual([semanticRelationId]);
            expect(get(response, 'classes.parentMap')).toEqual({});
            expect(get(response, 'classes.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.classes, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'classes.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'classesWithIndividuals')).toEqual(['ClassA']);
            expect(get(response, 'classesAndIndividuals')).toEqual({ClassA: ['IndivA1', 'IndivA2']});
            expect(service.getIndividualsParentPath).toHaveBeenCalledWith(response);
            expect(get(response, 'individualsParentPath')).toEqual(['ClassA']);
            expect(get(response, 'dataProperties.parentMap')).toEqual({});
            expect(get(response, 'dataProperties.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.dataProperties, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'dataProperties.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'objectProperties.parentMap')).toEqual({});
            expect(get(response, 'objectProperties.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.objectProperties, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'objectProperties.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'annotations.parentMap')).toEqual({});
            expect(get(response, 'annotations.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.annotations, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'annotations.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'concepts.parentMap')).toEqual({});
            expect(get(response, 'concepts.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.concepts, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'concepts.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'conceptSchemes.parentMap')).toEqual({});
            expect(get(response, 'conceptSchemes.childMap')).toEqual({});
            expect(service.flattenHierarchy).toHaveBeenCalledWith(response.conceptSchemes, jasmine.objectContaining({ ontologyId }));
            expect(get(response, 'conceptSchemes.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'upToDate')).toBe(false);
            expect(get(response, 'iriList').sort()).toEqual([ontologyId, ontologyId2, annotationId, classId, datatypeId, ontologyPropertyId, dataPropertyId, individualId, conceptId, conceptSchemeId, semanticRelationId, annotationId2, classId2, dataPropertyId2, ontologyPropertyId2, individualId2, datatypeId2, conceptId2, conceptSchemeId2].sort());
            expect(service.createFlatEverythingTree).toHaveBeenCalledWith(response);
            expect(get(response, 'flatEverythingTree')).toEqual([hierarchyNode]);
            expect(service.createFlatIndividualTree).toHaveBeenCalledWith(response);
            expect(get(response, 'individuals.flat')).toEqual([hierarchyNode]);
            expect(get(response, 'failedImports')).toEqual(['failedId']);
            expect(get(response, 'importedOntologyIds')).toEqual(['id']);
            expect(get(response, 'importedOntologies')).toEqual([{
              id: 'id',
              ontologyId: ontologyId2
            }]);
            expect(get(response, 'userBranch')).toEqual(true);
            expect(get(response, 'createdFromExists')).toEqual(false);
            expect(get(response, 'masterBranchIri')).toEqual(branchId);
            expect(get(response, 'userCanModify')).toEqual(true);
            expect(get(response, 'userCanModifyMaster')).toEqual(true);
            expect(get(response, 'entityInfo')).toEqual({
              [ontologyId]: {
                label: 'Ontology Id', 
                names: [], 
                ontologyId: 'ontologyId',
                imported: false
              },
              [annotationId]: {
                label: 'Annotation Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [classId]: {
                label: 'Class Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [datatypeId]: {
                label: 'Datatype Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [ontologyPropertyId]: {
                label: 'Object Property Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [dataPropertyId]: {
                label: 'Data Property Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [individualId]: {
                label: 'Individual Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [conceptId]: {
                label: 'Concept Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [conceptSchemeId]: {
                label: 'Concept Scheme Id',
                names: [],
                ontologyId: ontologyId,
                imported: false
              },
              [annotationId2]: {
                label: 'Annotation Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [classId2]: {
                label: 'Concept',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [dataPropertyId2]: {
                label: 'Data Property Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [ontologyPropertyId2]: {
                label: 'Object Property 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [individualId2]: {
                label: 'Individual Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [datatypeId2]: {
                label: 'Datatype Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [conceptId2]: {
                label: 'Concept Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
              [conceptSchemeId2]: {
                label: 'Concept Scheme Id 2',
                names: [],
                ontologyId: ontologyId2,
                imported: true
              },
            });
          }, () => fail('Observable should have resolved'));
        tick();
        expect(ontologyManagerStub.getOntologyStuff).toHaveBeenCalledWith(recordId, userBranchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
      }));
    });
    it('when one call fails', fakeAsync(function() {
      catalogManagerStub.getRecordBranches.and.returnValue(throwError(error));
      service.createOntologyListItem(recordId, branchId, commitId, tagId, difference, true, title)
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
    }));
    it('when more than one call fails', fakeAsync(function() {
      ontologyManagerStub.getOntologyStuff.and.returnValue(throwError(error));
      catalogManagerStub.getRecordBranches.and.returnValue(throwError(error));
      service.createOntologyListItem(recordId, branchId, commitId, tagId, difference, true, title)
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
    }));
  });
  describe('setVocabularyStuff sets the appropriate state variables on', function() {
      const response: VocabularyStuff = {
          importedIRIs: [],
          derivedConcepts: ['derivedConcept'],
          derivedConceptSchemes: ['derivedConceptScheme'],
          derivedSemanticRelations: ['derivedSemanticRelation'],
          concepts: ['derivedConcept1', 'derivedConcept2'],
          conceptSchemes: ['derivedConceptScheme1', 'derivedConceptScheme2'],
          conceptHierarchy: {
              childMap: {'derivedConcept2': ['derivedConcept1']},
              parentMap: {'derivedConcept1': ['derivedConcept2']},
              circularMap: {}
          },
          conceptSchemeHierarchy: {
              childMap: {'derivedConceptScheme2': ['derivedConceptScheme1']},
              parentMap: {'derivedConceptScheme1': ['derivedConceptScheme2']},
              circularMap: {}
          }
      };
      beforeEach(function() {
          ontologyManagerStub.getVocabularyStuff.and.returnValue(of(response));
          spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
      });
      describe('the current listItem when getVocabularyStuff', function() {
          beforeEach(function() {
              service.listItem = listItem;
              service.listItem.ontologyId = ontologyId;
              service.listItem.derivedConcepts = ['0'];
              service.listItem.derivedConceptSchemes = ['0'];
              service.listItem.derivedSemanticRelations = ['0'];
              service.listItem.concepts = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [hierarchyNode], circularMap: {}};
              service.listItem.conceptSchemes = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [hierarchyNode], circularMap: {}};
              service.listItem.editorTabStates.concepts = {entityIRI: 'iri', usages: []};
              service.listItem.entityInfo = {};
          });
          it('resolves', fakeAsync(function() {
              service.setVocabularyStuff();
              tick();
              expect(ontologyManagerStub.getVocabularyStuff).toHaveBeenCalledWith(recordId, branchId, commitId);
              expect(service.listItem.derivedConcepts).toEqual(['derivedConcept']);
              expect(service.listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
              expect(service.listItem.derivedSemanticRelations).toEqual(['derivedSemanticRelation']);
              expect(service.listItem.concepts.iris).toEqual({'derivedConcept1': ontologyId, 'derivedConcept2': ontologyId});
              expect(service.listItem.concepts.childMap).toEqual(response.conceptHierarchy.childMap);
              expect(service.listItem.concepts.parentMap).toEqual(response.conceptHierarchy.parentMap);
              expect(service.listItem.concepts.flat).toEqual([hierarchyNode]);
              expect(service.listItem.conceptSchemes.iris).toEqual({'derivedConceptScheme1': ontologyId, 'derivedConceptScheme2': ontologyId});
              expect(service.listItem.conceptSchemes.childMap).toEqual(response.conceptSchemeHierarchy.childMap);
              expect(service.listItem.conceptSchemes.parentMap).toEqual(response.conceptSchemeHierarchy.parentMap);
              expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
              expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.concepts, jasmine.objectContaining({ontologyId: service.listItem.ontologyId}));
              expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes, jasmine.objectContaining({ontologyId: service.listItem.ontologyId}));
              expect(service.listItem.editorTabStates.concepts).toEqual({});
              expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          }));
          it('rejects', fakeAsync(function() {
              const originalConcepts = Object.assign({}, service.listItem.concepts);
              const originalConceptSchemes = Object.assign({}, service.listItem.conceptSchemes);
              ontologyManagerStub.getVocabularyStuff.and.returnValue(throwError(error));
              service.setVocabularyStuff();
              tick();
              expect(ontologyManagerStub.getVocabularyStuff).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId/* , service.vocabularySpinnerId */);
              expect(service.listItem.derivedConcepts).toEqual(['0']);
              expect(service.listItem.derivedConceptSchemes).toEqual(['0']);
              expect(service.listItem.derivedSemanticRelations).toEqual(['0']);
              expect(service.listItem.concepts).toEqual(originalConcepts);
              expect(service.listItem.conceptSchemes).toEqual(originalConceptSchemes);
              expect(service.flattenHierarchy).not.toHaveBeenCalled();
              expect(service.listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
              expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
          }));
      });
      describe('the provided listItem when getVocabularyStuff', function() {
          beforeEach(function() {
              listItem.derivedConcepts = ['0'];
              listItem.derivedConceptSchemes = ['0'];
              listItem.derivedSemanticRelations = ['0'];
              listItem.concepts = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [hierarchyNode], circularMap: {}};
              listItem.conceptSchemes = {iris: {'0': 'ont'}, parentMap: {'0': []}, childMap: {'0': []}, flat: [hierarchyNode], circularMap: {}};
              listItem.editorTabStates.concepts = {entityIRI: 'iri', usages: []};
          });
          it('resolves', fakeAsync(function() {
              service.setVocabularyStuff(listItem);
              tick();
              expect(ontologyManagerStub.getVocabularyStuff).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId);
              expect(listItem.derivedConcepts).toEqual(['derivedConcept']);
              expect(listItem.derivedConceptSchemes).toEqual(['derivedConceptScheme']);
              expect(listItem.concepts.iris).toEqual({'derivedConcept1': listItem.ontologyId, 'derivedConcept2': listItem.ontologyId});
              expect(listItem.concepts.parentMap).toEqual(response.conceptHierarchy.parentMap);
              expect(listItem.concepts.childMap).toEqual(response.conceptHierarchy.childMap);
              expect(listItem.concepts.flat).toEqual([hierarchyNode]);
              expect(listItem.conceptSchemes.iris).toEqual({'derivedConceptScheme1': listItem.ontologyId, 'derivedConceptScheme2': listItem.ontologyId});
              expect(listItem.conceptSchemes.parentMap).toEqual(response.conceptSchemeHierarchy.parentMap);
              expect(listItem.conceptSchemes.childMap).toEqual(response.conceptSchemeHierarchy.childMap);
              expect(listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
              expect(service.flattenHierarchy).toHaveBeenCalledWith(listItem.concepts, jasmine.objectContaining({ontologyId: listItem.ontologyId}));
              expect(service.flattenHierarchy).toHaveBeenCalledWith(listItem.conceptSchemes, jasmine.objectContaining({ontologyId: listItem.ontologyId}));
              expect(listItem.editorTabStates.concepts).toEqual({});
              expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          }));
          it('rejects', fakeAsync(function() {
              const originalConcepts = Object.assign({}, listItem.concepts);
              const originalConceptSchemes = Object.assign({}, listItem.conceptSchemes);
              ontologyManagerStub.getVocabularyStuff.and.returnValue(throwError(error));
              service.setVocabularyStuff(listItem);
              tick();
              expect(ontologyManagerStub.getVocabularyStuff).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId);
              expect(listItem.derivedConcepts).toEqual(['0']);
              expect(listItem.derivedConceptSchemes).toEqual(['0']);
              expect(listItem.derivedSemanticRelations).toEqual(['0']);
              expect(listItem.concepts).toEqual(originalConcepts);
              expect(listItem.conceptSchemes).toEqual(originalConceptSchemes);
              expect(service.flattenHierarchy).not.toHaveBeenCalled();
              expect(listItem.editorTabStates.concepts).toEqual({entityIRI: 'iri', usages: []});
              expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
          }));
      });
  });
  it('getIndividualsParentPath should return the list of unique classes', function() {
      listItem.classes = {
          childMap: {
              classB: ['classA'],
              classZ: ['classY']
          },
          circularMap: {},
          parentMap: {},
          iris: {
              classA: '',
              classY: ''
          },
          flat: []
      };
      listItem.classesAndIndividuals = {
          classA: ['ind1', 'ind2'],
          classB: ['ind3', 'ind4']
      };
      expect(service.getIndividualsParentPath(listItem)).toEqual(['classA', 'classB']);
  });
  it('flattenHierarchy properly flattens the provided hierarchy', function() {
    spyOn<any>(service, '_getEntityNameByListItem').and.callFake(a => a);
    const hierarchyInfo: Hierarchy = {
      iris: {
        'Class B': 'ontology',
        'Class B1': 'ontology',
        'Class B2': 'ontology',
        'Class A': 'ontology',
      },
      parentMap: {
        'Class B': ['Class B1', 'Class B2']
      },
      childMap: {
        'Class B1': ['Class B'],
        'Class B2': ['Class B']
      },
      circularMap: {},
      flat: []
    };
    expect(service.flattenHierarchy(hierarchyInfo, listItem)).toEqual([{
      entityIRI: 'Class A',
      hasChildren: false,
      path: [recordId, 'Class A'],
      joinedPath: `${recordId}.Class A`,
      indent: 0,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B',
      hasChildren: true,
      path: [recordId, 'Class B'],
      joinedPath: `${recordId}.Class B`,
      indent: 0,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B1',
      hasChildren: false,
      path: [recordId, 'Class B', 'Class B1'],
      joinedPath: `${recordId}.Class B.Class B1`,
      indent: 1,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B2',
      hasChildren: false,
      path: [recordId, 'Class B', 'Class B2'],
      joinedPath: `${recordId}.Class B.Class B2`,
      indent: 1,
      entityInfo: undefined
    }]);
  });
  it('createFlatEverythingTree creates the correct array', function() {
    listItem.classes = {iris: {[classId]: ontologyId}, childMap: {}, parentMap: {}, circularMap: {}, flat: []};
    listItem.classToChildProperties = {[classId]: ['property1']};
    listItem.noDomainProperties = ['property2'];
    listItem.entityInfo = {
      [classId]: {
        label: 'class',
        names: ['class']
      },
      property1: {
        label: 'data property 1',
        names: ['data property 1']
      },
      property2: {
        label: 'data property 2',
        names: ['data property 2']
      }
    };
    expect(service.createFlatEverythingTree(listItem)).toEqual([{
      entityIRI: classId,
      hasChildren: true,
      indent: 0,
      path: [recordId, classId],
      joinedPath: `${recordId}.${classId}`,
      entityInfo: {
        label: 'class',
        names: ['class']
      }
    }, {
      entityIRI: 'property1',
      hasChildren: false,
      indent: 1,
      path: [recordId, classId, 'property1'],
      joinedPath: `${recordId}.${classId}.property1`,
      entityInfo: {
        label: 'data property 1',
        names: ['data property 1']
      }
    }, {
      title: 'Properties',
      get: jasmine.any(Function),
      set: jasmine.any(Function)
    }, {
      entityIRI: 'property2',
      hasChildren: false,
      indent: 1,
      get: jasmine.any(Function),
      path: [recordId, 'property2'],
      joinedPath: `${recordId}.property2`,
      entityInfo: {
        label: 'data property 2',
        names: ['data property 2']
      }
    }]);
  });
  it('createFlatIndividualTree creates the correct array', function() {
    listItem.classes = { iris: {}, childMap: {}, parentMap: {}, circularMap: {}, flat: [{
      entityIRI: 'Class A',
      hasChildren: false,
      path: [recordId, 'Class A'],
      joinedPath: `${recordId}.Class A`,
      indent: 0,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B',
      hasChildren: true,
      path: [recordId, 'Class B'],
      joinedPath: `${recordId}.Class B`,
      indent: 0,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B1',
      hasChildren: false,
      path: [recordId, 'Class B', 'Class B1'],
      joinedPath: `${recordId}.Class B.Class B1`,
      indent: 1,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B2',
      hasChildren: false,
      path: [recordId, 'Class B', 'Class B2'],
      joinedPath: `${recordId}.Class B.Class B2`,
      indent: 1,
      entityInfo: undefined
    }] };
    listItem.classesAndIndividuals = {
      'Class A': ['Individual A2', 'Individual A1'],
      'Class B1': ['Individual B1']
    };
    listItem.individualsParentPath = ['Class A', 'Class B', 'Class B1'];
    expect(service.createFlatIndividualTree(listItem)).toEqual([{
      entityIRI: 'Class A',
      hasChildren: false,
      path: [recordId, 'Class A'],
      joinedPath: `${recordId}.Class A`,
      indent: 0,
      entityInfo: undefined,
      isClass: true
    }, {
      entityIRI: 'Individual A1',
      hasChildren: false,
      path: [recordId, 'Class A', 'Individual A1'],
      joinedPath: `${recordId}.Class A.Individual A1`,
      indent: 1,
      entityInfo: undefined
    }, {
      entityIRI: 'Individual A2',
      hasChildren: false,
      path: [recordId, 'Class A', 'Individual A2'],
      joinedPath: `${recordId}.Class A.Individual A2`,
      indent: 1,
      entityInfo: undefined
    }, {
      entityIRI: 'Class B',
      hasChildren: true,
      path: [recordId, 'Class B'],
      joinedPath: `${recordId}.Class B`,
      indent: 0,
      entityInfo: undefined,
      isClass: true
    }, {
      entityIRI: 'Class B1',
      hasChildren: false,
      path: [recordId, 'Class B', 'Class B1'],
      joinedPath: `${recordId}.Class B.Class B1`,
      indent: 1,
      entityInfo: undefined,
      isClass: true
    }, {
      entityIRI: 'Individual B1',
      hasChildren: false,
      path: [recordId, 'Class B', 'Class B1', 'Individual B1'],
      joinedPath: `${recordId}.Class B.Class B1.Individual B1`,
      indent: 2,
      entityInfo: undefined
    }]);
    expect(service.createFlatIndividualTree(undefined)).toEqual([]);
  });
  it('addEntity adds the entity to the provided ontology and index', function() {
    ontologyManagerStub.getEntityName.and.returnValue('name');
    ontologyManagerStub.getEntityNames.and.returnValue(['name']);
    service.addEntity(individualObj, listItem);
    expect(has(listItem.entityInfo, individualId)).toBe(true);
    expect(ontologyManagerStub.getEntityName).toHaveBeenCalledWith(individualObj);
    expect(listItem.entityInfo[individualId].label).toBe('name');
    expect(ontologyManagerStub.getEntityNames).toHaveBeenCalledWith(individualObj);
    expect(listItem.entityInfo[individualId].names).toEqual(['name']);
    expect(listItem.entityInfo[individualId].ontologyId).toBe(ontologyId);
  });
  it('removeEntity removes the entity from the iriList and index', function() {
    service.removeEntity(classId, listItem);
    expect(has(listItem.entityInfo, classId)).toBe(false);
    expect(listItem.iriList).not.toContain(classId);
  });
  describe('getEntityByRecordId returns', function() {
    it('object when listItem provided', function() {
      spyOn(service, 'getListItemByRecordId');
      expect(service.getEntityByRecordId(recordId, classId, listItem)).toEqual(listItem.entityInfo[classId]);
      expect(service.getListItemByRecordId).not.toHaveBeenCalled();
    });
    it('undefined when listItem present but entity is not', function() {
      listItem.entityInfo = {
        [classId]: {
          label: '',
          names: []
        }
      };
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
      ontologyManagerStub.getEntity.and.returnValue(classObj);
      expect(service.getEntityByRecordId(recordId, classId)).toEqual({ label: '', names: [] });
      expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
    });
    it('undefined when listItem is not present', function() {
      spyOn(service, 'getListItemByRecordId').and.returnValue(undefined);
      ontologyManagerStub.getEntity.and.returnValue(undefined);
      expect(service.getEntityByRecordId(recordId, classId)).toBeUndefined();
      expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
    });
  });
  describe('getEntity returns the JSON-LD of the entity and its blank nodes', function() {
    it('successfully', fakeAsync(function() {
      ontologyManagerStub.getEntityAndBlankNodes.and.returnValue(of([]));
      service.getEntity(classId, listItem)
        .subscribe(response => {
          expect(response).toEqual([]);
        }, () => fail('Observable should have resolved'));
      tick();
      expect(ontologyManagerStub.getEntityAndBlankNodes).toHaveBeenCalledWith(recordId, branchId, commitId, classId);
    }));
    it('unless an error occurs', fakeAsync(function() {
      ontologyManagerStub.getEntityAndBlankNodes.and.returnValue(throwError(error));
      service.getEntity(classId, listItem)
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(ontologyManagerStub.getEntityAndBlankNodes).toHaveBeenCalledWith(recordId, branchId, commitId, classId);
    }));
  });
  describe('getEntityNoBlankNodes returns the JSON-LD of the entity and its blank nodes', function() {
    it('successfully', fakeAsync(function() {
      spyOn(service, 'getEntity').and.returnValue(of([{'@id': classId}, {'@id': 'bnode'}]));
      service.getEntityNoBlankNodes(classId, listItem)
        .subscribe(response => {
          expect(response).toEqual({'@id': classId});
        }, () => fail('Observable should have resolved'));
      tick();
      expect(service.getEntity).toHaveBeenCalledWith(classId, listItem);
    }));
    it('unless an error occurs', fakeAsync(function() {
      spyOn(service, 'getEntity').and.returnValue(throwError(error));
      service.getEntityNoBlankNodes(classId, listItem)
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(service.getEntity).toHaveBeenCalledWith(classId, listItem);
    }));
  });
  describe('addToAdditions should call the correct functions', function() {
    it('when entity is in the additions list', function() {
      const statement = {'@id': 'id', 'prop': 'value'};
      listItem.additions = [{'@id': 'id'}];
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
      service.addToAdditions(recordId, statement);
      expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
      expect(listItem.additions[0]).toEqual(statement);
    });
    it('when entity is not in the additions list', function() {
      const statement = {'@id': 'id', 'prop': 'value'};
      listItem.additions = [];
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
      service.addToAdditions(recordId, statement);
      expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
      expect(listItem.additions[0]).toEqual(statement);
    });
  });
  describe('addToDeletions should call the correct functions', function() {
    it('when entity is in the deletions list', function() {
      const statement = {'@id': 'id', 'prop': 'value'};
      listItem.deletions = [{'@id': 'id'}];
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
      service.addToDeletions(recordId, statement);
      expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
      expect(listItem.deletions[0]).toEqual(statement);
    });
    it('when entity is not in the deletions list', function() {
      const statement = {'@id': 'id', 'prop': 'value'};
      listItem.deletions = [];
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
      service.addToDeletions(recordId, statement);
      expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
      expect(listItem.deletions[0]).toEqual(statement);
    });
  });
  it('setNoDomainsOpened sets the correct property on the state object', function() {
    service.listItem = listItem;
    spyOn(service, 'getActiveKey').and.returnValue('key');
    [true, false].forEach(value => {
      service.setNoDomainsOpened(value);
      expect(get(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.noDomainsOpened`)).toBe(value);
    });
  });
  describe('getNoDomainsOpened gets the correct property value on the state object', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('when path is not found, returns false', function() {
      expect(service.getNoDomainsOpened()).toBe(false);
    });
    it('when path is found', function() {
      spyOn(service, 'getActiveKey').and.returnValue('key');
      [true, false].forEach(value => {
        set(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.noDomainsOpened`, value);
        expect(service.getNoDomainsOpened()).toBe(value);
      });
    });
  });
  it('setDataPropertiesOpened sets the correct property on the state object', function() {
    service.listItem = listItem;
    spyOn(service, 'getActiveKey').and.returnValue('key');
    [true, false].forEach(value => {
      service.setDataPropertiesOpened(value);
      expect(get(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.dataPropertiesOpened`)).toBe(value);
    });
  });
  describe('getDataPropertiesOpened gets the correct property value on the state object', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('when path is not found, returns false', function() {
      expect(service.getDataPropertiesOpened()).toBe(false);
    });
    it('when path is found', function() {
      spyOn(service, 'getActiveKey').and.returnValue('key');
      [true, false].forEach(value => {
        set(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.dataPropertiesOpened`, value);
        expect(service.getDataPropertiesOpened()).toBe(value);
      });
    });
  });
  it('setObjectPropertiesOpened sets the correct property on the state object', function() {
    service.listItem = listItem;
    spyOn(service, 'getActiveKey').and.returnValue('key');
    [true, false].forEach(value => {
      service.setObjectPropertiesOpened(value);
      expect(get(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.objectPropertiesOpened`)).toBe(value);
    });
  });
  describe('getObjectPropertiesOpened gets the correct property value on the state object', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('when path is not found, returns false', function() {
      expect(service.getObjectPropertiesOpened()).toBe(false);
    });
    it('when path is found', function() {
      spyOn(service, 'getActiveKey').and.returnValue('key');
      [true, false].forEach(value => {
        set(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.objectPropertiesOpened`, value);
        expect(service.getObjectPropertiesOpened()).toBe(value);
      });
    });
  });
  it('setAnnotationPropertiesOpened sets the correct property on the state object', function() {
    service.listItem = listItem;
    spyOn(service, 'getActiveKey').and.returnValue('key');
    [true, false].forEach(value => {
      service.setAnnotationPropertiesOpened(value);
      expect(get(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.annotationPropertiesOpened`)).toBe(value);
    });
  });
  describe('getAnnotationPropertiesOpened gets the correct property value on the state object', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('when path is not found, returns false', function() {
      expect(service.getAnnotationPropertiesOpened()).toBe(false);
    });
    it('when path is found', function() {
      spyOn(service, 'getActiveKey').and.returnValue('key');
      [true, false].forEach(value => {
        set(service.listItem.editorTabStates, `key.${encodeURIComponent(recordId)}.annotationPropertiesOpened`, value);
        expect(service.getAnnotationPropertiesOpened()).toBe(value);
      });
    });
  });
  describe('onEdit calls the correct manager methods', function() {
    const iriBegin = 'begin';
    const iriThen = 'then';
    const iriEnd = 'end';
    const newIRI = iriBegin + iriThen + iriEnd;
    beforeEach(function() {
      service.listItem = listItem;
      listItem.selected = {'@id': 'test'};
      spyOn(service, 'getActivePage').and.returnValue({});
      spyOn(service, 'addToAdditions');
      spyOn(service, 'addToDeletions');
      spyOn(service, 'recalculateJoinedPaths');
      ontologyManagerStub.getEntityUsages.and.returnValue(of([]));
    });
    it('regardless of getEntityUsages outcome when no match in additions', function() {
      service.onEdit(iriBegin, iriThen, iriEnd);
      expect(service.recalculateJoinedPaths).toHaveBeenCalledWith(service.listItem);
      expect(updateRefsStub.update).toHaveBeenCalledWith(service.listItem, service.listItem.selected['@id'], newIRI, jasmine.any(Array));
      expect(service.getActivePage).toHaveBeenCalledWith();
      expect(service.addToAdditions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, Object.assign({}, service.listItem.selected));
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, Object.assign({}, service.listItem.selected));
      expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, service.listItem.selected['@id'], 'construct');
    });
    it('regardless of getEntityUsages outcome when match in additions', function() {
      service.listItem.additions = [Object.assign({}, service.listItem.selected)];
      service.onEdit(iriBegin, iriThen, iriEnd);
      expect(service.recalculateJoinedPaths).toHaveBeenCalledWith(service.listItem);
      expect(updateRefsStub.update).toHaveBeenCalledWith(service.listItem, service.listItem.selected['@id'], newIRI, jasmine.any(Array));
      expect(service.getActivePage).toHaveBeenCalledWith();
      expect(service.addToAdditions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, Object.assign({}, service.listItem.selected));
      expect(service.addToDeletions).not.toHaveBeenCalled();
      expect(service.listItem.additions.length).toBe(0);
      expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, service.listItem.selected['@id'], 'construct');
    });
    describe('when getActiveKey is', function() {
      it('project', function() {
        spyOn(service, 'getActiveKey').and.returnValue('project');
        spyOn(service, 'setCommonIriParts');
        service.onEdit(iriBegin, iriThen, iriEnd);
        expect(service.recalculateJoinedPaths).toHaveBeenCalledWith(service.listItem);
        expect(service.setCommonIriParts).not.toHaveBeenCalled();
      });
      it('not project', function() {
        spyOn(service, 'getActiveKey').and.returnValue('other');
        spyOn(service, 'setCommonIriParts');
        service.onEdit(iriBegin, iriThen, iriEnd);
        expect(service.recalculateJoinedPaths).toHaveBeenCalledWith(service.listItem);
        expect(service.setCommonIriParts).toHaveBeenCalledWith(iriBegin, iriThen);
      });
    });
    it('when getEntityUsages resolves', fakeAsync(function() {
      const statement = {'@id': 'test-id'};
      const response = [statement];
      ontologyManagerStub.getEntityUsages.and.returnValue(of(response));
      service.onEdit(iriBegin, iriThen, iriEnd).subscribe();
      tick();
      expect(service.recalculateJoinedPaths).toHaveBeenCalledWith(service.listItem);
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, statement);
      expect(updateRefsStub.update).toHaveBeenCalledWith(response, service.listItem.selected['@id'], newIRI, jasmine.any(Array));
      expect(service.addToAdditions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, statement);
    }));
    it('when getEntityUsages rejects', fakeAsync(function() {
      ontologyManagerStub.getEntityUsages.and.returnValue(throwError(error));
      service.onEdit(iriBegin, iriThen, iriEnd).subscribe();
      tick();
      expect(service.recalculateJoinedPaths).toHaveBeenCalledWith(service.listItem);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
    }));
  });
  it('setCommonIriParts sets the proper values based on parameters', function() {
    service.listItem = listItem;
    service.setCommonIriParts('begin', 'then');
    expect(service.listItem.iriBegin).toEqual('begin');
    expect(service.listItem.iriThen).toEqual('then');
  });
  describe('setSelected should set the correct values and call the correct methods', function() {
    const id = 'id';
    const object = {'@id': id};
    const bnode = {'@id': '_:node0'};
    beforeEach(function() {
      spyOn(service, 'setEntityUsages');
      spyOn(service, 'getActivePage').and.returnValue({});
      ontologyManagerStub.getEntityAndBlankNodes.and.returnValue(of([object, bnode]));
      manchesterConverterStub.jsonldToManchester.and.returnValue('');
    });
    it('if a falsy entityIRI is passed', fakeAsync(function() {
      service.setSelected('', undefined, listItem)
        .subscribe(() => {}, () => fail('Observable should have resolved'));
      tick();
      expect(listItem.selected).toBeUndefined();
      expect(listItem.selectedBlankNodes).toEqual([]);
      expect(listItem.blankNodes).toEqual({});
      expect(ontologyManagerStub.getEntityAndBlankNodes).not.toHaveBeenCalled();
    }));
    it('when an element is passed', fakeAsync(function() {
      const el = new MockElementRef();
      service.setSelected(id, false, listItem, el).subscribe();
      tick();
      expect(ontologyManagerStub.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, id, undefined, undefined, true, true);
      expect(listItem.selected).toEqual(object);
      expect(listItem.selectedBlankNodes).toEqual([bnode]);
      expect(listItem.blankNodes).toEqual({[bnode['@id']]: ''});
      expect(manchesterConverterStub.jsonldToManchester).toHaveBeenCalledWith(bnode['@id'], listItem.selectedBlankNodes, {[bnode['@id']]: {position: 0}}, true);
      expect(service.getActivePage).not.toHaveBeenCalled();
      expect(service.setEntityUsages).not.toHaveBeenCalled();
      expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(el);
      expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(el);
    }));
    it('when getUsages is true and getActivePage object does not have a usages property', fakeAsync(function() {
      service.setSelected(id, true, listItem).subscribe();
      tick();
      expect(ontologyManagerStub.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, id, undefined, undefined, true, false);
      expect(listItem.selected).toEqual(object);
      expect(listItem.selectedBlankNodes).toEqual([bnode]);
      expect(listItem.blankNodes).toEqual({[bnode['@id']]: ''});
      expect(manchesterConverterStub.jsonldToManchester).toHaveBeenCalledWith(bnode['@id'], listItem.selectedBlankNodes, {[bnode['@id']]: {position: 0}}, true);
      expect(service.getActivePage).toHaveBeenCalledWith();
      expect(service.setEntityUsages).toHaveBeenCalledWith(id);
    }));
    it('when getUsages is false', fakeAsync(function() {
      service.setSelected(id, false, listItem).subscribe();
      tick();
      expect(ontologyManagerStub.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, id, undefined, undefined, true, false);
      expect(listItem.selected).toEqual(object);
      expect(listItem.selectedBlankNodes).toEqual([bnode]);
      expect(listItem.blankNodes).toEqual({[bnode['@id']]: ''});
      expect(manchesterConverterStub.jsonldToManchester).toHaveBeenCalledWith(bnode['@id'], listItem.selectedBlankNodes, {[bnode['@id']]: {position: 0}}, true);
      expect(service.getActivePage).not.toHaveBeenCalled();
      expect(service.setEntityUsages).not.toHaveBeenCalled();
    }));
    it('when the entity is an individual', fakeAsync(function() {
      ontologyManagerStub.isIndividual.and.returnValue(true);
      object['urn:prop'] = [{'@value': 'test'}];
      service.setSelected(id, false, listItem).subscribe();
      tick();
      expect(ontologyManagerStub.getEntityAndBlankNodes).toHaveBeenCalledWith(listItem.versionedRdfRecord.recordId, listItem.versionedRdfRecord.branchId, listItem.versionedRdfRecord.commitId, id, undefined, undefined, true, false);
      expect(listItem.selected).toEqual(object);
      expect(listItem.selected['urn:prop']).toEqual([{'@value': 'test', '@type': `${XSD}string`}]);
      expect(listItem.selectedBlankNodes).toEqual([bnode]);
      expect(listItem.blankNodes).toEqual({[bnode['@id']]: ''});
      expect(manchesterConverterStub.jsonldToManchester).toHaveBeenCalledWith(bnode['@id'], listItem.selectedBlankNodes, {[bnode['@id']]: {position: 0}}, true);
      expect(service.getActivePage).not.toHaveBeenCalled();
      expect(service.setEntityUsages).not.toHaveBeenCalled();
    }));
  });
  describe('setEntityUsages should call the correct function', function() {
    const id = 'idx';
    const key = 'project';
    const el = new MockElementRef();
    beforeEach(function() {
      service.listItem = listItem;
      this.activePage = { usagesContainer: el };
      service.listItem.editorTabStates = {};
      service.listItem.editorTabStates[key] = this.activePage;
      spyOn(service, 'getActivePage').and.returnValue(this.activePage);
      spyOn(service, 'getActiveKey').and.returnValue(key);
    });
    describe('with a tab index', function() {
      it('when getEntityUsages resolves', fakeAsync(function() {
        const response = [{'@id': id}];
        ontologyManagerStub.getEntityUsages.and.returnValue(of(response));
        service.setEntityUsages(id, undefined, 3);
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith(service.listItem, 3);
        expect(service.getActiveKey).toHaveBeenCalledWith(service.listItem, 3);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(el);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(el);
        expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, id, 'select'/* , this.httpId */);
        expect(service.listItem.editorTabStates[key].usages).toEqual(response);
      }));
      it('when getEntityUsages rejects', fakeAsync(function() {
        ontologyManagerStub.getEntityUsages.and.returnValue(throwError(error));
        service.setEntityUsages(id, undefined, 3);
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith(service.listItem, 3);
        expect(service.getActiveKey).toHaveBeenCalledWith(service.listItem, 3);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(el);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(el);
        expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, id, 'select'/* , this.httpId */);
        expect(service.listItem.editorTabStates[key].usages).toEqual([]);
      }));
    });
    describe('without a tab index', function() {
      it('when getEntityUsages resolves', fakeAsync(function() {
        const response = [{'@id': id}];
        ontologyManagerStub.getEntityUsages.and.returnValue(of(response));
        service.setEntityUsages(id);
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith(service.listItem);
        expect(service.getActiveKey).toHaveBeenCalledWith(service.listItem, undefined);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(el);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(el);
        expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, id, 'select'/* , this.httpId */);
        expect(service.listItem.editorTabStates[key].usages).toEqual(response);
      }));
      it('when getEntityUsages rejects', fakeAsync(function() {
        ontologyManagerStub.getEntityUsages.and.returnValue(throwError(error));
        service.setEntityUsages(id);
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith(service.listItem);
        expect(service.getActiveKey).toHaveBeenCalledWith(service.listItem, undefined);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(el);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(el);
        expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, id, 'select'/* , this.httpId */);
        expect(service.listItem.editorTabStates[key].usages).toEqual([]);
      }));
    });
  });
  // TODO test for getBnodeIndex
  describe('resetStateTabs should set the correct variables', function() {
    beforeEach(function() {
      this.el = new MockElementRef();
      service.listItem = listItem;
      service.listItem.editorTabStates = {
        classes: {entityIRI: 'id', usages: []},
        project: {entityIRI: 'id', preview: 'test', element: this.el}
      };
      spyOn(service, 'setSelected').and.callFake(() => {
        service.listItem.selected = {'@id': 'id'};
        service.listItem.selectedBlankNodes = [{'@id': 'bnode'}];
        service.listItem.blankNodes = {bnode: 'bnode'};
        return of(null);
      });
      spyOn(service, 'resetSearchTab');
      service.listItem.selected = undefined;
      service.listItem.ontologyId = 'newId';
      service.listItem.seeHistory = true;
    });
    it('when getActiveKey is not project or search', fakeAsync(function() {
      spyOn(service, 'getActiveKey').and.returnValue('classes');
      service.resetStateTabs().subscribe();
      tick();
      expect(service.resetSearchTab).toHaveBeenCalledWith(listItem);
      expect(service.listItem.editorTabStates.classes).toEqual({open: {}, searchText: ''});
      expect(service.listItem.selected).toBeUndefined();
      expect(service.listItem.selectedBlankNodes).toEqual([]);
      expect(service.listItem.blankNodes).toEqual({});
      expect(service.setSelected).not.toHaveBeenCalled();
      expect(service.listItem.seeHistory).toBe(false);
    }));
    it('when getActiveKey is project', fakeAsync(function() {
      spyOn(service, 'getActiveKey').and.returnValue('project');
      service.resetStateTabs().subscribe();
      tick();
      expect(service.resetSearchTab).toHaveBeenCalledWith(listItem);
      expect(service.listItem.editorTabStates.project).toEqual({entityIRI: 'newId', preview: '', element: this.el});
      expect(service.listItem.selected).toEqual({'@id': 'id'});
      expect(service.listItem.selectedBlankNodes).toEqual([{'@id': 'bnode'}]);
      expect(service.listItem.blankNodes).toEqual({bnode: 'bnode'});
      expect(service.setSelected).toHaveBeenCalledWith('newId', false, service.listItem, this.el);
      expect(service.listItem.seeHistory).toBe(false);
    }));
  });
  it('resetSearchTab should reset variables', function() {
    service.listItem = listItem;
    service.listItem.editorTabStates.search = {
      errorMessage: 'test',
      infoMessage: 'test',
      results: {test: 'a'},
      searchText: 'test',
      selected: {test: 'a'},
      highlightText: 'test'
    };
    service.resetSearchTab();
    expect(service.listItem.editorTabStates.search.errorMessage).toEqual('');
    expect(service.listItem.editorTabStates.search.infoMessage).toEqual('');
    expect(service.listItem.editorTabStates.search.results).toEqual({});
    expect(service.listItem.editorTabStates.search.searchText).toEqual('');
    expect(service.listItem.editorTabStates.search.selected).toEqual({});
    expect(service.listItem.editorTabStates.search.highlightText).toEqual('');
  });
  describe('getActiveKey', function() {
    it('defaults to "project"', function() {
      listItem.tabIndex = undefined;
      expect(service.getActiveKey(listItem)).toEqual('project');
    });
    it('returns the correct value', function() {
      listItem.tabIndex = OntologyListItem.CLASSES_TAB;
      expect(service.getActiveKey(listItem)).toEqual('classes');
    });
  });
  it('getActivePage gets the proper item', function() {
    spyOn(service, 'getActiveKey').and.returnValue('tab');
    expect(service.getActivePage(listItem)).toEqual(listItem.editorTabStates.tab);
  });
  it('getActiveEntityIRI should return the proper value', function() {
    listItem.editorTabStates.classes.entityIRI = classId;
    const spy = spyOn(service, 'getActivePage').and.returnValue(listItem.editorTabStates.classes);
    expect(service.getActiveEntityIRI(listItem)).toEqual(classId);

    spy.and.returnValue(listItem.editorTabStates.overview);
    expect(service.getActiveEntityIRI(listItem)).toEqual(undefined);
  });
  describe('selectItem should call the proper functions', function() {
    beforeEach(function() {
      service.listItem = listItem;
      spyOn(service, 'getActivePage').and.returnValue(service.listItem.editorTabStates.classes);
      spyOn(service, 'setEntityUsages');
      spyOn(service, 'setSelected').and.returnValue(of(null));
    });
    it('when entityIRI is undefined', fakeAsync(function() {
      service.selectItem(undefined)
        .subscribe(() => {}, () => fail('Observable should have resolved'));
      tick();
      expect(service.getActivePage).toHaveBeenCalledWith();
      expect(service.setEntityUsages).not.toHaveBeenCalled();
      expect(service.setSelected).toHaveBeenCalledWith(undefined, false, service.listItem, undefined);
    }));
    describe('when entityIRI is defined', function() {
      it('and getUsages is true', fakeAsync(function() {
        service.selectItem(classId, true)
          .subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith();
        expect(service.listItem.editorTabStates.classes.entityIRI).toEqual(classId);
        expect(service.setEntityUsages).toHaveBeenCalledWith(classId, service.listItem, undefined);
        expect(service.setSelected).toHaveBeenCalledWith(classId, false, service.listItem, undefined);
      }));
      it('getUsages is true with a tab index', fakeAsync(function() {
        service.selectItem(classId, true, 3)
          .subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith(service.listItem, 3);
        expect(service.listItem.editorTabStates.classes.entityIRI).toEqual(classId);
        expect(service.setEntityUsages).toHaveBeenCalledWith(classId, service.listItem, 3);
        expect(service.setSelected).toHaveBeenCalledWith(classId, false, service.listItem, undefined);
      }));
      it('and getUsages is false', fakeAsync(function() {
        service.selectItem(classId, false)
          .subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith();
        expect(service.listItem.editorTabStates.classes.entityIRI).toEqual(classId);
        expect(service.setEntityUsages).not.toHaveBeenCalled();
        expect(service.setSelected).toHaveBeenCalledWith(classId, false, service.listItem, undefined);
      }));
      it('and an element is set on the page', fakeAsync(function() {
        const el = new MockElementRef();
        service.listItem.editorTabStates.classes.element = el;
        service.selectItem(classId, false)
          .subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(service.getActivePage).toHaveBeenCalledWith();
        expect(service.listItem.editorTabStates.classes.entityIRI).toEqual(classId);
        expect(service.setEntityUsages).not.toHaveBeenCalled();
        expect(service.setSelected).toHaveBeenCalledWith(classId, false, service.listItem, el);
      }));
    });
  });
  it('unSelectItem sets all the variables appropriately', function() {
    service.listItem = listItem;
    spyOn(service, 'getActivePage').and.returnValue(service.listItem.editorTabStates.tab);
    service.unSelectItem();
    expect(service.listItem.selected).toBeUndefined();
    expect(service.listItem.selectedBlankNodes).toEqual([]);
    expect(service.listItem.blankNodes).toEqual({});
    expect(!has(service.listItem.editorTabStates.tab, 'entityIRI')).toBe(true);
    expect(!has(service.listItem.editorTabStates.tab, 'usages')).toBe(true);
  });
  describe('hasChanges returns the proper value', function() {
    it('when the listItem has additions', function() {
      listItem.additions = [{'@id': 'test'}];
      expect(service.hasChanges(listItem)).toBe(true);
    });
    it('when the listItem has deletions', function() {
      listItem.deletions = [{'@id': 'test'}];
      expect(service.hasChanges(listItem)).toBe(true);
    });
    it('when the listItem has neither additions nor deletions', function() {
      listItem.additions = [];
      listItem.deletions = [];
      expect(service.hasChanges(listItem)).toBe(false);
    });
  });
  describe('addEntityToHierarchy should add the entity to the proper maps', function() {
    it('where the parent entity has children', function() {
      service.addEntityToHierarchy(hierarchyInfo, 'new-node', 'node1a');
      expect(hierarchyInfo.parentMap['node1a']).toEqual(['node2a', 'node2b', 'node2c', 'new-node']);
      expect(hierarchyInfo.childMap['new-node']).toEqual(['node1a']);
    });
    it('where the parent does not have children', function() {
      service.addEntityToHierarchy(hierarchyInfo, 'new-node', 'node3c');
      expect(hierarchyInfo.parentMap['node3c']).toEqual(['new-node']);
      expect(hierarchyInfo.childMap['new-node']).toEqual(['node3c']);
    });
    it('unless the parent entity is not in the hierarchy', function() {
      const originalParentMap = Object.assign({}, hierarchyInfo.parentMap);
      const originalChildMap = Object.assign({}, hierarchyInfo.childMap);
      service.addEntityToHierarchy(hierarchyInfo, 'new-node', 'not-there');
      expect(hierarchyInfo.parentMap).toEqual(originalParentMap);
      expect(hierarchyInfo.childMap).toEqual(originalChildMap);
    });
    it('when the relationships are circular', function() {
      const originalParentMap = Object.assign({}, hierarchyInfo.parentMap);
      const originalChildMap = Object.assign({}, hierarchyInfo.childMap);
      service.addEntityToHierarchy(hierarchyInfo, 'node1a', 'node2a');
      expect(hierarchyInfo.parentMap).toEqual(originalParentMap);
      expect(hierarchyInfo.childMap).toEqual(originalChildMap);
      expect(hierarchyInfo.circularMap).toEqual({'node2a': {'node1a': ['node1a', 'node2a']}});
    });
  });
  describe('deleteEntityFromParentInHierarchy should remove the provided entityIRI from the parentIRI', function() {
    it('with non-circular nodes', function() {
      service.deleteEntityFromParentInHierarchy(hierarchyInfo, 'node3a', 'node3b');
      expect(hierarchyInfo.parentMap['node3b']).toBeUndefined();
      expect(hierarchyInfo.childMap['node3a']).toEqual(['node2a', 'node2b']);
    });
    it('with circular nodes', function() {
      hierarchyInfo.circularMap = {'node3a': {'node2c': ['node2c', 'node3b', 'node3a']}};
      service.deleteEntityFromParentInHierarchy(hierarchyInfo, 'node3b', 'node2c');
      expect(hierarchyInfo.parentMap['node3a']).toEqual(['node2c']);
      expect(hierarchyInfo.childMap['node2c']).toEqual(['node1a', 'node3a']);
      expect(hierarchyInfo.circularMap).toEqual({});
    });
  });
  describe('deleteEntityFromHierarchy', function() {
    it('should delete the entity from the hierarchy tree', function() {
      service.deleteEntityFromHierarchy(hierarchyInfo, 'node3a');
      expect(hierarchyInfo.parentMap['node2a']).toEqual(['node3c']);
      expect(hierarchyInfo.parentMap['node2b']).toBeUndefined();
      expect(hierarchyInfo.parentMap['node3b']).toBeUndefined();
      expect(hierarchyInfo.childMap['node3a']).toBeUndefined();
    });
    it('should move the children if required', function() {
      service.deleteEntityFromHierarchy(hierarchyInfo, 'node2a');
      expect(hierarchyInfo.parentMap['node2a']).toBeUndefined();
      expect(hierarchyInfo.parentMap['node1a']).toEqual(['node2b', 'node2c']);
      expect(hierarchyInfo.childMap['node2a']).toBeUndefined();
      expect(hierarchyInfo.childMap['node3a']).toEqual(['node2b', 'node3b']);
      expect(hierarchyInfo.childMap['node3c']).toBeUndefined();
    });
  });
  it('getPathsTo should return all paths to provided node', function() {
    const expectedPaths = [
      ['node1a', 'node2a', 'node3a'],
      ['node1a', 'node2b', 'node3a'],
      ['node1a', 'node2c', 'node3b', 'node3a'],
      ['node1b', 'node3b', 'node3a']
    ];
    const result = service.getPathsTo(hierarchyInfo, 'node3a');
    expect(result.length).toBe(4);
    expect(sortBy(result)).toEqual(sortBy(expectedPaths));
  });
  // TODO: test for isDirectParentOpen
  describe('areParentsOpen should return', function() {
    const node: HierarchyNode = {
      indent: 1,
      entityIRI: 'iri',
      path: [recordId, 'otherIRI', 'andAnotherIRI', 'iri'],
      joinedPath: `${recordId}.otherIRI.andAnotherIRI.iri`,
      hasChildren: false,
      toggledClosed: true,
      entityInfo: undefined
    };
    const tab = 'classes';
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('true when all parent paths are open', function() {
      service.listItem.editorTabStates[tab].open = {
        [node.joinedPath]: true,
        [`${recordId}.otherIRI.andAnotherIRI`]: true,
        [`${recordId}.otherIRI`]: true
      };
      expect(service.areParentsOpen(node, tab)).toBe(true);
    });
    it('false when only some parent paths are open', function() {
      service.listItem.editorTabStates[tab].open = {
        [node.joinedPath]: true,
        [`${recordId}.otherIRI.andAnotherIRI`]: true
      };
      expect(service.areParentsOpen(node, tab)).toBe(false);
    });
    it('false when all parent paths are not open', function() {
      expect(service.areParentsOpen(node, tab)).toBe(false);
    });
  });
  it('joinPath joins the provided array correctly', function() {
    expect(service.joinPath(['a', 'b', 'c'])).toBe('a.b.c');
  });
  describe('goTo calls the proper manager functions with correct parameters when it is', function() {
    beforeEach(function() {
      this.el = new MockElementRef();
      spyOn(service, 'getActivePage').and.returnValue({entityIRI: '', component: this.el});
      spyOn(service, 'selectItem').and.returnValue(of(null));
      spyOn(service, 'openAt');
      spyOn(service, 'areParentsOpen').and.returnValue(true);
      spyOn(service, 'getDataPropertiesOpened').and.returnValue(true);
      spyOn(service, 'getObjectPropertiesOpened').and.returnValue(true);
      spyOn(service, 'getAnnotationPropertiesOpened').and.returnValue(true);

      service.listItem = listItem;
      listItem.concepts = {
        iris: {
          concept1: ''
        },
        flat: [{
          indent: 0,
          entityIRI: 'otherIri',
          hasChildren: true,
          path: [recordId, 'otherIri'],
          joinedPath: '',
          entityInfo: undefined
        }, {
          indent: 1,
          entityIRI: 'concept1',
          hasChildren: false,
          path: [recordId, 'otherIri', 'concept1'],
          joinedPath: '',
          entityInfo: undefined
        }, {
          indent: 0,
          entityIRI: 'concept2',
          hasChildren: false,
          path: [recordId, 'concept2'],
          joinedPath: '',
          entityInfo: undefined
        }],
        parentMap: {},
        childMap: {},
        circularMap: {}
      };
      listItem.conceptSchemes = {
        iris: {
          scheme1: ''
        },
        flat: [{
          indent: 0,
          entityIRI: 'otherIri',
          hasChildren: true,
          path: ['recordId', 'otherIri'],
          joinedPath: '',
          entityInfo: undefined
        }, {
          indent: 1,
          entityIRI: 'scheme1',
          hasChildren: false,
          path: ['recordId', 'otherIri', 'scheme1'],
          joinedPath: '',
          entityInfo: undefined
        }, {
          indent: 0,
          entityIRI: 'scheme2',
          hasChildren: false,
          path: ['recordId', 'scheme2'],
          joinedPath: '',
          entityInfo: undefined
        }],
        parentMap: {},
        childMap: {},
        circularMap: {}
      };
      listItem.classes = {
        iris: {
          class1: ''
        },
        flat: [{
          indent: 0,
          entityIRI: 'otherIri',
          hasChildren: true,
          path: ['recordId', 'otherIri'],
          joinedPath: '',
          entityInfo: undefined
        }, {
          indent: 1,
          entityIRI: 'class1',
          hasChildren: false,
          path: ['recordId', 'otherIri', 'class1'],
          joinedPath: '',
          entityInfo: undefined
        }, {
          indent: 0,
          entityIRI: 'anotherIri',
          hasChildren: false,
          path: ['recordId', 'antherIri'],
          joinedPath: '',
          entityInfo: undefined
        }],
        parentMap: {},
        childMap: {},
        circularMap: {}
      };
      listItem.dataProperties = {
        iris: {
          dataProp1: '',
          dataProp2: ''
        },
        flat: [{
          entityIRI: 'dataProp1',
          hasChildren: true,
          indent: 1,
          path: [],
          joinedPath: '',
          entityInfo: undefined,
          get: service.getDataPropertiesOpened
        }, {
          entityIRI: 'dataProp2',
          hasChildren: false,
          indent: 2,
          path: [],
          joinedPath: '',
          entityInfo: undefined,
          get: service.getDataPropertiesOpened
        }],
        parentMap: {},
        childMap: {},
        circularMap: {}
      };
      listItem.objectProperties = {
        iris: {
          objectProp1: ''
        },
        flat: [{
          entityIRI: 'objectProp1',
          hasChildren: false,
          indent: 1,
          path: [],
          joinedPath: '',
          entityInfo: undefined,
          get: service.getObjectPropertiesOpened
        }],
        parentMap: {},
        childMap: {},
        circularMap: {}
      };
      listItem.annotations = {
        iris: {
          annotationProp1: ''
        },
        flat: [{
          entityIRI: 'annotationProp1',
          hasChildren: false,
          indent: 1,
          path: [],
          joinedPath: '',
          entityInfo: undefined,
          get: service.getAnnotationPropertiesOpened
        }],
        parentMap: {},
        childMap: {},
        circularMap: {}
      };
      listItem.individuals = {
        iris: {
          individual1: ''
        },
        flat: [{
          indent: 0,
          entityIRI: 'otherIri',
          hasChildren: true,
          path: ['recordId', 'otherIri'],
          joinedPath: '',
          entityInfo: undefined,
        }, {
          indent: 1,
          entityIRI: 'scheme1',
          hasChildren: false,
          path: ['recordId', 'otherIri', 'individual1'],
          joinedPath: '',
          entityInfo: undefined,
        }, {
          indent: 0,
          entityIRI: 'anotherIri',
          hasChildren: false,
          path: ['recordId', 'antherIri'],
          joinedPath: '',
          entityInfo: undefined,
        }]
      };
      listItem.derivedConcepts = ['concept2'];
      listItem.derivedConceptSchemes = ['scheme2'];
    });
    it('an ontology', function() {
      service.goTo('ontologyId');
      expect(listItem.tabIndex).toEqual(OntologyListItem.PROJECT_TAB);
      expect(service.selectItem).toHaveBeenCalledWith('ontologyId', undefined, 0);
    });
    it('a class', function() {
      service.goTo('class1');
      expect(listItem.tabIndex).toEqual(OntologyListItem.CLASSES_TAB);
      expect(service.selectItem).toHaveBeenCalledWith('class1', undefined, 2);
      expect(service.openAt).toHaveBeenCalledWith(service.listItem.classes.flat, 'class1', 2);
      expect(service.listItem.editorTabStates.classes.index).toEqual(1);
    });
    it('a datatype property', function() {
      spyOn(service, 'setDataPropertiesOpened');
      service.goTo('dataProp2');
      expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
      expect(service.selectItem).toHaveBeenCalledWith('dataProp2', undefined, 3);
      expect(service.openAt).toHaveBeenCalledWith(service.listItem.dataProperties.flat, 'dataProp2', 3);
      expect(service.setDataPropertiesOpened).toHaveBeenCalledWith(true, 3);
      expect(service.listItem.editorTabStates.properties.index).toEqual(2);
    });
    describe('an object property', function() {
      it('with datatype properties in the ontology', function() {
        spyOn(service, 'setObjectPropertiesOpened');
        service.goTo('objectProp1');
        expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
        expect(service.selectItem).toHaveBeenCalledWith('objectProp1', undefined, 3);
        expect(service.openAt).toHaveBeenCalledWith(service.listItem.objectProperties.flat, 'objectProp1', 3);
        expect(service.setObjectPropertiesOpened).toHaveBeenCalledWith(true, 3);
        expect(service.listItem.editorTabStates.properties.index).toEqual(4);
      });
      it('with no datatype properties in the ontology', function() {
        service.listItem.dataProperties.flat = [];
        spyOn(service, 'setObjectPropertiesOpened');
        service.goTo('objectProp1');
        expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
        expect(service.selectItem).toHaveBeenCalledWith('objectProp1', undefined, 3);
        expect(service.openAt).toHaveBeenCalledWith(service.listItem.objectProperties.flat, 'objectProp1', 3);
        expect(service.setObjectPropertiesOpened).toHaveBeenCalledWith(true, 3);
        expect(service.listItem.editorTabStates.properties.index).toEqual(1);
      });
    });
    describe('an annotation property', function() {
      describe('with datatype properties in the ontology', function() {
        it('with object properties in the ontology', function() {
          spyOn(service, 'setAnnotationPropertiesOpened');
          service.goTo('annotationProp1');
          expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
          expect(service.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 3);
          expect(service.openAt).toHaveBeenCalledWith(service.listItem.annotations.flat, 'annotationProp1', 3);
          expect(service.setAnnotationPropertiesOpened).toHaveBeenCalledWith(true, 3);
          expect(service.listItem.editorTabStates.properties.index).toEqual(6);
        });
        it('with no object properties in the ontology', function() {
          service.listItem.objectProperties.flat = [];
          spyOn(service, 'setAnnotationPropertiesOpened');
          service.goTo('annotationProp1');
          expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
          expect(service.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 3);
          expect(service.openAt).toHaveBeenCalledWith(service.listItem.annotations.flat, 'annotationProp1', 3);
          expect(service.setAnnotationPropertiesOpened).toHaveBeenCalledWith(true, 3);
          expect(service.listItem.editorTabStates.properties.index).toEqual(4);
        });
      });
      describe('with no datatype properties in the ontology', function() {
        beforeEach(function() {
          service.listItem.dataProperties.flat = [];
        });
        it('with object properties in the ontology', function() {
          spyOn(service, 'setAnnotationPropertiesOpened');
          service.goTo('annotationProp1');
          expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
          expect(service.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 3);
          expect(service.openAt).toHaveBeenCalledWith(service.listItem.annotations.flat, 'annotationProp1', 3);
          expect(service.setAnnotationPropertiesOpened).toHaveBeenCalledWith(true, 3);
          expect(service.listItem.editorTabStates.properties.index).toEqual(3);
        });
        it('with no object properties in the ontology', function() {
          service.listItem.objectProperties.flat = [];
          spyOn(service, 'setAnnotationPropertiesOpened');
          service.goTo('annotationProp1');
          expect(listItem.tabIndex).toEqual(OntologyListItem.PROPERTIES_TAB);
          expect(service.selectItem).toHaveBeenCalledWith('annotationProp1', undefined, 3);
          expect(service.openAt).toHaveBeenCalledWith(service.listItem.annotations.flat, 'annotationProp1', 3);
          expect(service.setAnnotationPropertiesOpened).toHaveBeenCalledWith(true, 3);
          expect(service.listItem.editorTabStates.properties.index).toEqual(1);
        });
      });
    });
    it('a concept', function() {
      service.goTo('concept1');
      expect(listItem.tabIndex).toEqual(OntologyListItem.CONCEPTS_TAB);
      expect(service.selectItem).toHaveBeenCalledWith('concept1', undefined, 6);
      expect(service.openAt).toHaveBeenCalledWith(service.listItem.concepts.flat, 'concept1', 6);
      expect(service.listItem.editorTabStates.concepts.index).toEqual(1);
    });
    it('a conceptScheme', function() {
      service.goTo('scheme1');
      expect(listItem.tabIndex).toEqual(OntologyListItem.CONCEPTS_SCHEMES_TAB);
      expect(service.selectItem).toHaveBeenCalledWith('scheme1', undefined, 5);
      expect(service.openAt).toHaveBeenCalledWith(service.listItem.conceptSchemes.flat, 'scheme1', 5);
      expect(service.listItem.editorTabStates.schemes.index).toEqual(1);
    });
    it('an individual', function() {
      service.goTo('individual1');
      expect(listItem.tabIndex).toEqual(OntologyListItem.INDIVIDUALS_TAB);
      expect(service.selectItem).toHaveBeenCalledWith('individual1', undefined, 4);
      expect(service.openAt).toHaveBeenCalledWith(service.listItem.individuals.flat, 'individual1', 4);
      expect(service.listItem.editorTabStates.individuals.index).toEqual(3);
    });
  });
  it('openAt sets all parents open', function() {
    service.listItem = listItem;
    spyOn(service, 'getActiveKey').and.returnValue('classes');
    service.openAt([{
      entityIRI: 'iri-a',
      path: [recordId, 'iri-a'],
      joinedPath: `${recordId}.iri-a`,
      hasChildren: false,
      indent: 0,
      entityInfo: undefined
    }, {
      entityIRI: 'iri-b',
      path: [recordId, 'iri-a', 'iri-b'],
      joinedPath: `${recordId}.iri-a.iri-b`,
      hasChildren: false,
      indent: 0,
      entityInfo: undefined
    }, {
      entityIRI: 'iri-c',
      path: [recordId, 'iri-a', 'iri-b', 'iri-c'],
      joinedPath: `${recordId}.iri-a.iri-b.iri-c`,
      hasChildren: false,
      indent: 0,
      entityInfo: undefined
    }], 'iri-c');
    expect(service.listItem.editorTabStates['classes'].open[`${recordId}.iri-a`]).toEqual(true);
    expect(service.listItem.editorTabStates['classes'].open[`${recordId}.iri-a.iri-b`]).toEqual(true);
  });
  describe('getDefaultPrefix returns the proper value for the prefix associated with ontology', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('when there is no iriBegin or iriThen', function() {
      service.listItem.ontologyId = 'ontologyId#';
      expect(service.getDefaultPrefix()).toEqual('ontologyId/#');
    });
    it('when there is a iriBegin and iriThen', function() {
      service.listItem.iriBegin = 'begin#';
      service.listItem.iriThen = 'then';
      expect(service.getDefaultPrefix()).toEqual('begin/then');
    });
    it('when the iri is a blank node and nothing is in the index', function() {
      service.listItem.ontologyId = 'https://mobi.com/.well-known/genid/genid1#';
      service.listItem.entityInfo = {};
      expect(service.getDefaultPrefix().startsWith('https://mobi.com/blank-node-namespace/')).toBeTrue();
    });
    it('when the iri is a blank node and there is something in the entityInfo', function() {
      service.listItem.ontologyId = 'https://mobi.com/.well-known/genid/genid1#';
      service.listItem.entityInfo = {
        'http://matonto.org/ontologies/uhtc#Element': {
          label: 'test',
          names: ['test'],
          ontologyId: 'https://mobi.com/.well-known/genid/genid1#'
        }
      };
      expect(service.getDefaultPrefix()).toEqual('http://matonto.org/ontologies/uhtc#');
    });
  });
  describe('updatePropertyIcon should set the icon of an entity', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.propertyIcons = {};
    });
    it('unless it is not a property', function() {
      ontologyManagerStub.isProperty.and.returnValue(false);
      service.updatePropertyIcon(classObj);
      expect(service.listItem.propertyIcons).toEqual({});
    });
    describe('if it is a property', function() {
      const createEntity = (test): JSONLDObject => {
        return {
          '@id': 'test',
          [`${RDFS}range`]: [{'@id': test}]
        };
      };
      beforeEach(function() {
        ontologyManagerStub.isProperty.and.returnValue(true);
      });
      it('with more than one range', function() {
        service.updatePropertyIcon({
          '@id': 'test',
          [`${RDFS}range`]: [{'@id': '1'}, {'@id': '2'}]
        });
        expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-cubes');
      });
      it('with a range of xsd:string or rdf:langString', function() {
        [`${XSD}string`, `${RDF}langString`].forEach(test => {
          service.updatePropertyIcon(createEntity(test));
          expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-font');
        });
      });
      it('with a range of xsd:decimal, xsd:double, xsd:float, xsd:int, xsd:integer, xsd:long, or xsd:nonNegativeInteger', function() {
        [`${XSD}decimal`, `${XSD}double`, `${XSD}float`, `${XSD}int`, `${XSD}integer`, `${XSD}long`, `${XSD}nonNegativeInteger`].forEach(test => {
          service.updatePropertyIcon(createEntity(test));
          expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-calculator');
        });
      });
      it('with a range of xsd:language', function() {
        service.updatePropertyIcon(createEntity(`${XSD}language`));
        expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-language');
      });
      it('with a range of xsd:anyURI', function() {
        service.updatePropertyIcon(createEntity(`${XSD}anyURI`));
        expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-external-link');
      });
      it('with a range of xsd:dateTime', function() {
        service.updatePropertyIcon(createEntity(`${XSD}dateTime`));
        expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-clock-o');
      });
      it('with a range of xsd:boolean or xsd:byte', function() {
        [`${XSD}boolean`, `${XSD}byte`].forEach(test => {
          service.updatePropertyIcon(createEntity(test));
          expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-signal');
        });
      });
      it('with a range of rdfs:Literal', function() {
        service.updatePropertyIcon(createEntity(`${RDFS}Literal`));
        expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-cube');
      });
      it('with a range that is not predefined', function() {
        service.updatePropertyIcon(createEntity('test'));
        expect(get(service.listItem.propertyIcons, 'test')).toBe('fa-link');
      });
    });
  });
  describe('addToClassIRIs should add an IRI to classes.iris and update isVocabulary', function() {
    beforeEach(function () {
      listItem.isVocabulary = false;
      listItem.entityInfo = {};
    });
    it('unless the IRI is already in the list', function() {
      listItem.classes.iris['iri'] = ontologyId;
      service.addToClassIRIs(listItem, 'iri');
      expect(listItem.classes.iris).toEqual({ iri: ontologyId });
    });
    describe('if the IRI does not exist in the list', function() {
      it('and IRI is skos:Concept', function() {
        service.addToClassIRIs(listItem, `${SKOS}Concept`);
        expect(listItem.isVocabulary).toEqual(true);
        expect(listItem.classes.iris).toEqual({ [`${SKOS}Concept`]: ontologyId });
      });
      it('and IRI is skos:ConceptScheme', function() {
        service.addToClassIRIs(listItem, `${SKOS}ConceptScheme`);
        expect(listItem.isVocabulary).toEqual(true);
        expect(listItem.classes.iris).toEqual({ [`${SKOS}ConceptScheme`]: ontologyId });
      });
      it('unless IRI is not skos:Concept', function() {
        service.addToClassIRIs(listItem, 'iri');
        expect(listItem.isVocabulary).toEqual(false);
        expect(listItem.classes.iris).toEqual({ iri: ontologyId });
      });
    });
  });
  describe('removeFromClassIRIs should remove an IRI from classes.iris and update isVocabulary', function() {
    beforeEach(function() {
      listItem.isVocabulary = true;
    });
    describe('if IRI is skos:Concept and classIRIs', function() {
      beforeEach(function() {
        listItem.classes.iris = {[`${SKOS}Concept`]: 'ontology'};
      });
      it('has skos:ConceptScheme', function() {
        listItem.classes.iris[`${SKOS}ConceptScheme`] = 'ontology';
        service.removeFromClassIRIs(listItem, `${SKOS}Concept`);
        expect(listItem.isVocabulary).toEqual(true);
        expect(listItem.classes.iris).toEqual({[`${SKOS}ConceptScheme`]: 'ontology'});
      });
      it('does not have skos:ConceptScheme', function() {
        service.removeFromClassIRIs(listItem, `${SKOS}Concept`);
        expect(listItem.isVocabulary).toEqual(false);
        expect(listItem.classes.iris).toEqual({});
      });
    });
    describe('if IRI is skos:ConceptScheme and classIRIs', function() {
      beforeEach(function() {
        listItem.classes.iris = {[`${SKOS}ConceptScheme`]: 'ontology'};
      });
      it('has skos:Concept', function() {
        listItem.classes.iris[`${SKOS}Concept`] = 'ontology';
        service.removeFromClassIRIs(listItem, `${SKOS}ConceptScheme`);
        expect(listItem.isVocabulary).toEqual(true);
        expect(listItem.classes.iris).toEqual({[`${SKOS}Concept`]: 'ontology'});
      });
      it('does not have skos:Concept', function() {
        service.removeFromClassIRIs(listItem, `${SKOS}ConceptScheme`);
        expect(listItem.isVocabulary).toEqual(false);
        expect(listItem.classes.iris).toEqual({});
      });
    });
    it('unless IRI is not skos:Concept', function () {
      listItem.classes.iris = {iri: 'ontology'};
      service.removeFromClassIRIs(listItem, 'iri');
      expect(listItem.isVocabulary).toEqual(true);
      expect(listItem.classes.iris).toEqual({});
    });
  });
  // TODO: test for getFromListItem
  // TODO: test for existsInListItem
  describe('isImported should return', function() {
    describe('false when', function() {
      it('iri matches listItem.ontologyId', function() {
        expect(service.isImported(ontologyId, listItem)).toBe(false);
      });
      it('entityInfo has imported equal to false', function() {
        listItem.entityInfo = {
          iri: {
            imported: false,
            label: '',
            names: []
          }
        };
        expect(service.isImported('iri', listItem)).toBe(false);
      });
    });
    describe('true when', function() {
      it('entityInfo has imported equal to true', function() {
        listItem.entityInfo = {
          iri: {
            imported: true,
            label: '',
            names: []
          }
        };
        expect(service.isImported('iri', listItem)).toBe(true);
      });
      it('entityInfo does not have the iri', function() {
        expect(service.isImported('missing', listItem)).toBe(true);
      });
    });
  });
  describe('isIriDeprecated should return', function() {
    describe('false when', function() {
      it('iri matches listItem.ontologyId', function() {
        expect(service.isIriDeprecated(ontologyId, listItem)).toBe(false);
      });
      it('iri is not in the iris object', function() {
        listItem.deprecatedIris = { iri1: '' };
        expect(service.isIriDeprecated('iri', listItem)).toBe(false);
      });
    });
    describe('true when', function() {
      it('iri is in the iris object', function() {
        listItem.deprecatedIris = { iri: 'ontId' };
        expect(service.isIriDeprecated('iri', listItem)).toBe(true);
      });

    });
  });
  describe('annotationModified should', function() {
    describe('add to listItem.deprecatedIris when', function() {
      it('annotationIri is owl:deprecated and value is true', function() {
        listItem.deprecatedIris = {};
        const expected = { iri: ontologyId };
        service.annotationModified('iri', `${OWL}deprecated`, 'true', listItem);
        expect(listItem.deprecatedIris).toEqual(expected);
      });
    });
    describe('remove from listItem.deprecatedIris when', function() {
      it('annotationIri is owl:deprecated and value is false', function() {
        listItem.ontologyId = 'ontologyId';
        listItem.deprecatedIris = { iri: ontologyId };
        const expected = {};
        service.annotationModified('iri', `${OWL}deprecated`, 'false', listItem);
        expect(listItem.deprecatedIris).toEqual(expected);
      });
    });
    describe('listItem.deprecatedIris should stay the same when', function() {
      it('annotationIri is not owl:deprecated and value is something', function() {
        listItem.deprecatedIris = { iri: ontologyId };
        const expected = { iri: ontologyId };
        service.annotationModified('iri', `${OWL}annotation1`, 'false', listItem);
        expect(listItem.deprecatedIris).toEqual(expected);
      });
    });
  });
  describe('isSelectedImported calls the correct method when', function() {
    it('listItem.selected is defined', function() {
      listItem.selected = {'@id': 'selected'};
      spyOn(service, 'isImported').and.returnValue(true);
      expect(service.isSelectedImported(listItem)).toBe(true);
      expect(service.isImported).toHaveBeenCalledWith('selected', listItem);
    });
    it('listItem.selected is undefined', function() {
      delete listItem.selected;
      spyOn(service, 'isImported');
      expect(service.isSelectedImported(listItem)).toBe(false);
      expect(service.isImported).not.toHaveBeenCalled();
    });
  });
  // TODO: test for collapseFlatLists
  it('recalculateJoinedPaths sets joinedPaths correctly', function() {
    const node: HierarchyNode = {
      entityIRI: 'iri',
      hasChildren: false,
      indent: 1,
      path: [recordId, 'otherIRI', 'andAnotherIRI', 'somethingNew'],
      joinedPath: `${recordId}.otherIRI.andAnotherIRI.iri`,
      entityInfo: undefined
    };
    listItem.classes.flat.push(node);
    listItem.individuals.flat.push(node);
    set(listItem.editorTabStates, 'classes.open.' + node.joinedPath, true);
    set(listItem.editorTabStates, 'individuals.open.' + node.joinedPath, true);
    let classInQuestion = filter(listItem.classes.flat, {'entityIRI': 'iri'});
    expect(classInQuestion.length).toEqual(1);
    let individualInQuestion = filter(listItem.individuals.flat, {'entityIRI': 'iri'});
    expect(individualInQuestion.length).toEqual(1);
    expect(classInQuestion[0].joinedPath).toEqual(`${recordId}.otherIRI.andAnotherIRI.iri`);
    expect(individualInQuestion[0].joinedPath).toEqual(`${recordId}.otherIRI.andAnotherIRI.iri`);
    service.recalculateJoinedPaths(listItem);

    classInQuestion = filter(listItem.classes.flat, {'entityIRI': 'iri'});
    expect(classInQuestion.length).toEqual(1);
    individualInQuestion = filter(listItem.individuals.flat, {'entityIRI': 'iri'});
    expect(individualInQuestion.length).toEqual(1);
    expect(classInQuestion[0].joinedPath).toEqual(`${recordId}.otherIRI.andAnotherIRI.somethingNew`);
    expect(individualInQuestion[0].joinedPath).toEqual(`${recordId}.otherIRI.andAnotherIRI.somethingNew`);
  });
  // TODO: test for alterTreeHierarchy
  describe('handleDeletedClass should add the entity to the proper maps', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.noDomainProperties = [];
      service.listItem.propertyIcons = {
        'iri1': 'icon',
        'iri2': 'icon',
        'iri3': 'icon'
      };
      service.listItem.classToChildProperties = {
        'class1': ['iri1', 'iri2'],
        'class2': ['iri2', 'iri4'],
        'class3': ['iri3', 'iri4']
      };
    });
    it('when the property has no domains', function() {
      service.handleDeletedClass('class1');
      expect(service.listItem.noDomainProperties).toEqual(['iri1']);
    });
    it('when the property has a domain', function() {
      service.handleDeletedClass('class2');
      expect(service.listItem.noDomainProperties).toEqual([]);
    });
  });
  describe('handleDeletedProperties should delete the entity from the proper maps', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('when the property has a domain', function() {
      this.property = {
        '@id': 'iri1',
        [`${RDFS}domain`]: [{'@id': 'class1'}]
      };
      service.listItem.noDomainProperties = [];
      service.listItem.classToChildProperties = {
        'class1': ['iri1', 'iri2'],
        'class2': ['iri2', 'iri5'],
        'class3': ['iri3', 'iri4']
      };
      service.handleDeletedProperty(this.property);
      expect(service.listItem.classToChildProperties['class1']).toEqual(['iri2']);
    });
    it('when the property does not have a domain', function() {
      this.property = {
        '@id': 'iri1'
      };
      service.listItem.noDomainProperties = ['iri1', 'iri2'];
      service.listItem.classToChildProperties = {
        'class2': ['iri3', 'iri4']
      };
      service.handleDeletedProperty(this.property);
      expect(service.listItem.classToChildProperties['class2']).toEqual(['iri3', 'iri4']);
      expect(service.listItem.noDomainProperties).toEqual(['iri2']);
    });
  });
  describe('handleNewProperty should add the entity to the proper maps', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.noDomainProperties = [];
      service.listItem.classToChildProperties = {
        'class1': [],
        'class2': ['iri2', 'iri5'],
        'class3': ['iri3', 'iri4']
      };
    });
    it('when the property has domains', function() {
      this.property = {
        '@id': 'iri1',
        [`${RDFS}domain`]: [{'@id': 'class1'}]
      };
      service.handleNewProperty(this.property);
      expect(service.listItem.classToChildProperties['class1']).toEqual(['iri1']);
    });
    it('when the property has no domain', function() {
      this.property = {
        '@id': 'iri1',
      };
      service.handleNewProperty(this.property);
      expect(service.listItem.noDomainProperties).toEqual(['iri1']);
    });
  });
  it('addPropertyToClasses should add the entity to the proper maps', function() {
    service.listItem = listItem;
    service.listItem.noDomainProperties = [];
    service.listItem.classToChildProperties = {
      'class1': ['iri1', 'iri2'],
      'class2': ['iri2', 'iri5'],
      'class3': ['iri3', 'iri4']
    };
    service.addPropertyToClasses('iri1', ['class2']);
    expect(service.listItem.classToChildProperties['class2']).toEqual(['iri2','iri5','iri1']);
  });
  describe('removePropertyFromClass should add the entity to the proper maps', function() {
    beforeEach(function() {
      service.listItem = listItem;
      this.property = {
        '@id': 'iri1',
      };
      service.listItem.noDomainProperties = [];
      service.listItem.classToChildProperties = {
        'class1': ['iri1', 'iri2'],
        'class2': ['iri2', 'iri5'],
        'class3': ['iri3', 'iri4']
      };
    });
    it('when the property has no domains', function() {
      service.removePropertyFromClass(this.property, 'class1');
      expect(service.listItem.classToChildProperties['class1']).toEqual(['iri2']);
      expect(service.listItem.noDomainProperties).toEqual(['iri1']);
    });
    it('when the property has a domain', function() {
      this.property = {
        '@id': 'iri1',
        [`${RDFS}domain`]: [{'@id': 'class1'}, {'@id': 'class2'}]
      };
      service.removePropertyFromClass(this.property, 'class2');
      expect(service.listItem.noDomainProperties).toEqual([]);
    });
  });
  describe('containsDerivedConcept returns', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.derivedConcepts = ['derived'];
    });
    describe('true if array contains', function() {
      it('a derived Concept', function() {
        expect(service.containsDerivedConcept(['derived'])).toEqual(true);
      });
      it('skos:Concept', function() {
        expect(service.containsDerivedConcept([`${SKOS}Concept`])).toEqual(true);
      });
    });
    it('false if array does not contain a derived Concept or skos:Concept', function() {
      expect(service.containsDerivedConcept(['test'])).toEqual(false);
    });
  });
  describe('containsDerivedSemanticRelation returns', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.derivedSemanticRelations = ['derived'];
    });
    describe('true if array contains', function() {
      it('a derived semanticRelation', function() {
        expect(service.containsDerivedSemanticRelation(['derived'])).toEqual(true);
      });
      it('skos:semanticRelation', function() {
        expect(service.containsDerivedSemanticRelation([`${SKOS}semanticRelation`])).toEqual(true);
      });
    });
    it('false if array does not contain a derived semanticRelation or skos:semanticRelation', function() {
      expect(service.containsDerivedSemanticRelation(['test'])).toEqual(false);
    });
  });
  describe('containsDerivedConceptScheme returns', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.derivedConceptSchemes = ['derived'];
    });
    describe('true if array contains', function() {
      it('a derived ConceptScheme', function() {
        expect(service.containsDerivedConceptScheme(['derived'])).toEqual(true);
      });
      it('skos:ConceptScheme', function() {
        expect(service.containsDerivedConceptScheme([`${SKOS}ConceptScheme`])).toEqual(true);
      });
    });
    it('false if array does not contain a derived ConceptScheme or skos:ConceptScheme', function() {
      expect(service.containsDerivedConceptScheme(['test'])).toEqual(false);
    });
  });
  describe('updateVocabularyHierarchies should call proper methods', function() {
    const values = [{'@id': 'value1'}, {'@id': 'value2'}];
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.selected = {'@id': 'selectedId', '@type': ['selected']};
      spyOn(service, 'addEntityToHierarchy');
      spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    });
    it('unless the property is not a relationship', fakeAsync(function() {
      spyOn(service, 'containsDerivedConcept').and.returnValue(true);
      spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
      spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id}));
      service.updateVocabularyHierarchies('test', values);
      tick();
      expect(service.containsDerivedConcept).not.toHaveBeenCalled();
      expect(service.containsDerivedConceptScheme).not.toHaveBeenCalled();
      expect(service.getEntityNoBlankNodes).not.toHaveBeenCalled();
      expect(service.addEntityToHierarchy).not.toHaveBeenCalled();
      expect(service.flattenHierarchy).not.toHaveBeenCalled();
    }));
    describe('when the relationship is', function() {
      [
        {
          targetArray: OntologyStateService.broaderRelations,
          otherArray: OntologyStateService.narrowerRelations,
          key: 'concepts',
          entityIRI: 'selectedId',
          parentIRI: '',
          selectedTypeExpect: 'containsDerivedConcept',
          targetTypeExpect: 'containsDerivedConcept'
        },
        {
          targetArray: OntologyStateService.narrowerRelations,
          otherArray: OntologyStateService.broaderRelations,
          key: 'concepts',
          entityIRI: '',
          parentIRI: 'selectedId',
          selectedTypeExpect: 'containsDerivedConcept',
          targetTypeExpect: 'containsDerivedConcept'
        },
        {
          targetArray: OntologyStateService.conceptToScheme,
          otherArray: OntologyStateService.schemeToConcept,
          key: 'conceptSchemes',
          entityIRI: 'selectedId',
          parentIRI: '',
          selectedTypeExpect: 'containsDerivedConcept',
          targetTypeExpect: 'containsDerivedConceptScheme'
        },
        {
          targetArray: OntologyStateService.schemeToConcept,
          otherArray: OntologyStateService.conceptToScheme,
          key: 'conceptSchemes',
          entityIRI: '',
          parentIRI: 'selectedId',
          selectedTypeExpect: 'containsDerivedConceptScheme',
          targetTypeExpect: 'containsDerivedConcept'
        },
      ].forEach(test => {
        test.targetArray.forEach(relationship => {
          describe(`${relationship} and`, function() {
            it('should be updated', fakeAsync(function() {
              spyOn(service, 'containsDerivedConcept').and.returnValue(true);
              spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
              spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id, '@type': ['dummy']}));
              service.updateVocabularyHierarchies(relationship, values);
              tick();
              expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
              expect(service[test.targetTypeExpect]).toHaveBeenCalledWith(['dummy']);
              values.forEach(value => {
                expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith(value['@id'], service.listItem);
                expect(service.addEntityToHierarchy).toHaveBeenCalledWith(service.listItem[test.key], test.entityIRI || value['@id'], test.parentIRI || value['@id']);
              });
              expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem[test.key]);
              expect(service.listItem[test.key].flat).toEqual([hierarchyNode]);
            }));
            describe('should not be updated when', function() {
              it('selected is incorrect type', fakeAsync(function() {
                spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id, '@type': ['dummy']}));
                spyOn(service, 'containsDerivedConcept').and.returnValue(test.selectedTypeExpect !== 'containsDerivedConcept');
                spyOn(service, 'containsDerivedConceptScheme').and.returnValue(test.selectedTypeExpect !== 'containsDerivedConceptScheme');
                service.updateVocabularyHierarchies(relationship, values);
                tick();
                expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
                expect(service.getEntityNoBlankNodes).not.toHaveBeenCalled();
                expect(service.addEntityToHierarchy).not.toHaveBeenCalled();
                expect(service.flattenHierarchy).not.toHaveBeenCalled();
              }));
              describe('target entity', function() {
                describe('has relationship', function() {
                  test.otherArray.forEach(function(otherRelationship) {
                    it(otherRelationship, fakeAsync(function() {
                      spyOn(service, 'containsDerivedConcept').and.returnValue(true);
                      spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
                      spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({
                        '@id': id,
                        [otherRelationship]: [{'@id': 'selectedId'}]
                      }));
                      service.updateVocabularyHierarchies(relationship, values);
                      tick();
                      expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
                      expect(service[test.targetTypeExpect]).not.toHaveBeenCalledWith(['dummy']);
                      values.forEach(value => {
                        expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith(value['@id'], service.listItem);
                      });
                      expect(service.addEntityToHierarchy).not.toHaveBeenCalled();
                      expect(service.flattenHierarchy).not.toHaveBeenCalled();
                    }));
                  });
                });
                it('is incorrect type', fakeAsync(function() {
                  spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id, '@type': ['dummy']}));
                  if (test.targetTypeExpect === 'containsDerivedConcept') {
                    spyOn(service, 'containsDerivedConcept').and.callFake(types => !includes(types, 'dummy'));
                  } else {
                    spyOn(service, 'containsDerivedConcept').and.returnValue(true);
                  }
                  if (test.targetTypeExpect === 'containsDerivedConceptScheme') {
                    spyOn(service, 'containsDerivedConceptScheme').and.callFake(types => !includes(types, 'dummy'));
                  } else {
                    spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
                  }
                  service.updateVocabularyHierarchies(relationship, values);
                  tick();
                  expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
                  expect(service[test.targetTypeExpect]).toHaveBeenCalledWith(['dummy']);
                  values.forEach(value => {
                    expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith(value['@id'], service.listItem);
                  });
                  expect(service.addEntityToHierarchy).not.toHaveBeenCalled();
                  expect(service.flattenHierarchy).not.toHaveBeenCalled();
                }));
              });
            });
          });
        });
      });
    });
  });
  describe('removeFromVocabularyHierarchies should call the proper methods', function() {
    beforeEach(function() {
      service.listItem = listItem;
      spyOn(service, 'deleteEntityFromParentInHierarchy');
      spyOn(service, 'deleteEntityFromHierarchy');
      spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
      listItem.selected = {'@id': 'selectedId', '@type': ['selected']};
    });
    it('unless the property is not a relationship', fakeAsync(function() {
      spyOn(service, 'containsDerivedConcept').and.returnValue(true);
      spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
      spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id}));
      service.removeFromVocabularyHierarchies('test', {'@id': 'value1'});
      tick();
      expect(service.containsDerivedConcept).not.toHaveBeenCalled();
      expect(service.containsDerivedConceptScheme).not.toHaveBeenCalled();
      expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith('value1', service.listItem);
      expect(service.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
      expect(service.deleteEntityFromHierarchy).not.toHaveBeenCalled();
      expect(service.flattenHierarchy).not.toHaveBeenCalled();
    }));
    describe('when the relationship is', function() {
      [
        {
          targetArray: OntologyStateService.broaderRelations,
          otherArray: OntologyStateService.narrowerRelations,
          key: 'concepts',
          entityIRI: 'selectedId',
          parentIRI: 'value1',
          selectedTypeExpect: 'containsDerivedConcept',
          targetTypeExpect: 'containsDerivedConcept',
        },
        {
          targetArray: OntologyStateService.narrowerRelations,
          otherArray: OntologyStateService.broaderRelations,
          key: 'concepts',
          entityIRI: 'value1',
          parentIRI: 'selectedId',
          selectedTypeExpect: 'containsDerivedConcept',
          targetTypeExpect: 'containsDerivedConcept'
        },
        {
          targetArray: OntologyStateService.conceptToScheme,
          otherArray: OntologyStateService.schemeToConcept,
          key: 'conceptSchemes',
          entityIRI: 'selectedId',
          parentIRI: 'value1',
          selectedTypeExpect: 'containsDerivedConcept',
          targetTypeExpect: 'containsDerivedConceptScheme'
        },
        {
          targetArray: OntologyStateService.schemeToConcept,
          otherArray: OntologyStateService.conceptToScheme,
          key: 'conceptSchemes',
          entityIRI: 'value1',
          parentIRI: 'selectedId',
          selectedTypeExpect: 'containsDerivedConceptScheme',
          targetTypeExpect: 'containsDerivedConcept'
        }
      ].forEach(test => {
        test.targetArray.forEach(relationship => {
          describe(`${relationship} and`, function() {
            beforeEach(function() {
              set(service.listItem, 'editorTabStates.schemes.entityIRI', test.entityIRI);
            });
            it('should be updated', fakeAsync(function() {
              spyOn(service, 'containsDerivedConcept').and.returnValue(true);
              spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
              spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id, '@type': ['dummy']}));
              service.removeFromVocabularyHierarchies(relationship, {'@id': 'value1'});
              tick();
              expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
              expect(service[test.targetTypeExpect]).toHaveBeenCalledWith(['dummy']);
              expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith('value1', service.listItem);
              expect(service.deleteEntityFromParentInHierarchy).toHaveBeenCalledWith(service.listItem[test.key], test.entityIRI, test.parentIRI);
              if (test.key === 'conceptSchemes') {
                expect(service.listItem.editorTabStates.schemes.entityIRI).toBeUndefined();
              }
              expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem[test.key]);
              expect(service.listItem[test.key].flat).toEqual([hierarchyNode]);
            }));
            describe('should not be updated when', function() {
              it('selected is incorrect type', fakeAsync(function() {
                spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id, '@type': ['dummy']}));
                spyOn(service, 'containsDerivedConcept').and.returnValue(test.selectedTypeExpect !== 'containsDerivedConcept');
                spyOn(service, 'containsDerivedConceptScheme').and.returnValue(test.selectedTypeExpect !== 'containsDerivedConceptScheme');
                service.removeFromVocabularyHierarchies(relationship, {'@id': 'value1'});
                tick();
                expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith('value1', service.listItem);
                expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
                expect(service.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                expect(service.deleteEntityFromHierarchy).not.toHaveBeenCalled();
                expect(service.flattenHierarchy).not.toHaveBeenCalled();
              }));
              describe('targetEntity', function() {
                describe('has relationship', function() {
                  test.otherArray.forEach(function(otherRelationship) {
                    it(otherRelationship, fakeAsync(function() {
                      spyOn(service, 'containsDerivedConcept').and.returnValue(true);
                      spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
                      spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({
                        '@id': id,
                        [otherRelationship]: [{'@id': 'selectedId'}]
                      }));
                      service.removeFromVocabularyHierarchies(relationship, {'@id': 'value1'});
                      tick();
                      expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
                      expect(service[test.targetTypeExpect]).not.toHaveBeenCalledWith(['dummy']);
                      expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith('value1', service.listItem);
                      if (test.parentIRI) {
                        expect(service.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                      } else {
                        expect(service.deleteEntityFromHierarchy).not.toHaveBeenCalled();
                      }
                      expect(service.flattenHierarchy).not.toHaveBeenCalled();
                    }));
                  });
                });
                it('is incorrect type', fakeAsync(function() {
                  spyOn(service, 'getEntityNoBlankNodes').and.callFake(id => of({'@id': id, '@type': ['dummy']}));
                  if (test.targetTypeExpect === 'containsDerivedConcept') {
                    spyOn(service, 'containsDerivedConcept').and.callFake(types => !includes(types, 'dummy'));
                  } else {
                    spyOn(service, 'containsDerivedConcept').and.returnValue(true);
                  }
                  if (test.targetTypeExpect === 'containsDerivedConceptScheme') {
                    spyOn(service, 'containsDerivedConceptScheme').and.callFake(types => !includes(types, 'dummy'));
                  } else {
                    spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
                  }
                  service.removeFromVocabularyHierarchies(relationship, {'@id': 'value1'});
                  tick();
                  expect(service.getEntityNoBlankNodes).toHaveBeenCalledWith('value1', service.listItem);
                  expect(service[test.selectedTypeExpect]).toHaveBeenCalledWith(service.listItem.selected['@type']);
                  expect(service[test.targetTypeExpect]).toHaveBeenCalledWith(['dummy']);
                  expect(service.deleteEntityFromParentInHierarchy).not.toHaveBeenCalled();
                  expect(service.deleteEntityFromHierarchy).not.toHaveBeenCalled();
                  expect(service.flattenHierarchy).not.toHaveBeenCalled();
                }));
              });
            });
          });
        });
      });
    });
  });
  it('addConcept should update relevant lists when a concept is added', function() {
    service.listItem = listItem;
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    const concept = {'@id': 'concept'};
    service.addConcept(concept);
    expect(service.listItem.concepts.iris).toEqual({[concept['@id']]: service.listItem.ontologyId});
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.concepts);
    expect(service.listItem.concepts.flat).toEqual([hierarchyNode]);
  });
  it('addConceptScheme should update relevant lists when a conceptScheme is added', function() {
    service.listItem = listItem;
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    const scheme = {'@id': 'scheme'};
    service.addConceptScheme(scheme);
    expect(service.listItem.conceptSchemes.iris).toEqual({[scheme['@id']]: service.listItem.ontologyId});
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes);
    expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
  });
  it('addIndividual should update relevant lists when an individual is added', function() {
    service.listItem = listItem;
    const individual = {'@id': 'individual', '@type': ['ClassA']};
    spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
    spyOn(service, 'getPathsTo').and.returnValue([['ClassA']]);
    service.addIndividual(individual);
    expect(service.listItem.individuals.iris[individual['@id']]).toEqual(service.listItem.ontologyId);
    expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
    expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['individual']});
    expect(service.listItem.individualsParentPath).toEqual(['ClassA']);
    expect(service.getPathsTo).toHaveBeenCalledWith(service.listItem.classes, 'ClassA');
    expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
  });
  describe('commonDelete calls the proper methods', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    describe('when getEntityUsages resolves', function() {
      beforeEach(function() {
        spyOn(service, 'removeEntity');
        spyOn(service, 'unSelectItem');
        spyOn(service, 'addToDeletions');
        spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
        ontologyManagerStub.getEntityUsages.and.returnValue(of([{'@id': 'id'}]));
        spyOn(service, 'createFlatEverythingTree').and.returnValue([hierarchyNode]);
      });
      it('and when updateEverythingTree is false', fakeAsync(function() {
        service.commonDelete('iri')
          .subscribe(() => {}, () => {
            fail('Observable should have resolved');
          });
        tick();
        expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, 'iri', 'construct');
        expect(service.removeEntity).toHaveBeenCalledWith('iri');
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {'@id': 'id'});
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.selected);
        expect(service.unSelectItem).toHaveBeenCalledWith();
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
        expect(service.listItem.flatEverythingTree).not.toEqual([hierarchyNode]);
      }));
      it('and when updateEverythingTree is true', fakeAsync(function() {
        service.commonDelete('iri', true)
          .subscribe(() => {}, () => fail('Observable should have resolved'));
        tick();
        expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, 'iri', 'construct');
        expect(service.removeEntity).toHaveBeenCalledWith('iri');
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {'@id': 'id'});
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.selected);
        expect(service.unSelectItem).toHaveBeenCalledWith();
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.createFlatEverythingTree).toHaveBeenCalledWith(service.listItem);
        expect(service.listItem.flatEverythingTree).toEqual([hierarchyNode]);
      }));
    });
    it('when getEntityUsages rejects', fakeAsync(function() {
      ontologyManagerStub.getEntityUsages.and.returnValue(throwError(error));
      service.commonDelete('iri')
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(ontologyManagerStub.getEntityUsages).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, service.listItem.versionedRdfRecord.branchId, service.listItem.versionedRdfRecord.commitId, 'iri', 'construct');
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
    }));
  });
  it('deleteClass should call the proper methods', fakeAsync(function() {
    service.listItem = listItem;
    spyOn(service, 'getIndividualsParentPath').and.returnValue(['ClassA', 'ClassB']);
    service.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
    service.listItem.classesAndIndividuals = {
      'ClassA': ['IndivA1', 'IndivA2'],
      'ClassB': ['IndivB1']
    };
    spyOn(service, 'getActiveEntityIRI').and.returnValue('ClassB');
    spyOn(service, 'removeFromClassIRIs');
    spyOn(service, 'deleteEntityFromHierarchy');
    spyOn(service, 'setVocabularyStuff');
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
    spyOn(service, 'commonDelete').and.returnValue(of(null));
    service.deleteClass();
    tick();
    expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
    expect(service.removeFromClassIRIs).toHaveBeenCalledWith(service.listItem, 'ClassB');
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.classes, 'ClassB');
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.classes);
    expect(service.listItem.classes.flat).toEqual([hierarchyNode]);
    expect(service.commonDelete).toHaveBeenCalledWith('ClassB', true);
    expect(service.getIndividualsParentPath).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
    expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
    expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
    expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
    expect(service.setVocabularyStuff).toHaveBeenCalledWith();
  }));
  it('deleteObjectProperty should call the proper methods', fakeAsync(function() {
    service.listItem = listItem;
    service.listItem.noDomainProperties = ['iri'];
    service.listItem.propertyIcons = {'iri': 'icon'};
    spyOn(service, 'handleDeletedProperty');
    spyOn(service, 'deleteEntityFromHierarchy');
    spyOn(service, 'setVocabularyStuff');
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    spyOn(service, 'commonDelete').and.returnValue(of(null));
    spyOn(service, 'getActiveEntityIRI').and.returnValue('iri');
    service.listItem.objectProperties.iris = {iri: 'ontology'};
    service.deleteObjectProperty();
    tick();
    expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
    expect(service.listItem.objectProperties.iris).toEqual({});
    expect(service.listItem.propertyIcons).toEqual({});
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.objectProperties, 'iri');
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.objectProperties);
    expect(service.listItem.objectProperties.flat).toEqual([hierarchyNode]);
    expect(service.commonDelete).toHaveBeenCalledWith('iri', true);
    expect(service.setVocabularyStuff).toHaveBeenCalledWith();
  }));
  it('deleteDataTypeProperty should call the proper methods', function() {
    service.listItem = listItem;
    service.listItem.noDomainProperties = ['iri'];
    service.listItem.propertyIcons = {'iri': 'icon'};
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    spyOn(service, 'handleDeletedProperty');
    spyOn(service, 'deleteEntityFromHierarchy');
    spyOn(service, 'commonDelete').and.returnValue(of(null));
    spyOn(service, 'getActiveEntityIRI').and.returnValue('iri');
    service.listItem.dataProperties.iris = {iri: 'ontology'};
    service.deleteDataTypeProperty();
    expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
    expect(service.listItem.dataProperties.iris).toEqual({});
    expect(service.listItem.propertyIcons).toEqual({});
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.dataProperties, 'iri');
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.dataProperties);
    expect(service.listItem.dataProperties.flat).toEqual([hierarchyNode]);
    expect(service.commonDelete).toHaveBeenCalledWith('iri', true);
  });
  it('deleteAnnotationProperty should call the proper methods', function() {
    service.listItem = listItem;
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    spyOn(service, 'deleteEntityFromHierarchy');
    spyOn(service, 'commonDelete').and.returnValue(of(null));
    spyOn(service, 'getActiveEntityIRI').and.returnValue('iri');
    service.listItem.annotations.iris = {iri: 'ontology'};
    service.deleteAnnotationProperty();
    expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
    expect(service.listItem.annotations.iris).toEqual({});
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.annotations, 'iri');
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.annotations);
    expect(service.listItem.annotations.flat).toEqual([hierarchyNode]);
    expect(service.commonDelete).toHaveBeenCalledWith('iri');
  });
  describe('deleteIndividual should call the proper methods', function() {
    beforeEach(function() {
      service.listItem = listItem;
      this.entityIRI = 'IndivB1';
      spyOn(service, 'getIndividualsParentPath').and.returnValue(['ClassA', 'ClassB']);
      service.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
      service.listItem.classesAndIndividuals = {
        'ClassA': ['IndivA1', 'IndivA2'],
        'ClassB': [this.entityIRI]
      };
      service.listItem.selected = {
        '@id': '',
        '@type': ['ClassB']
      };
      spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
      spyOn(service, 'commonDelete').and.returnValue(of(null));
      spyOn(service, 'deleteEntityFromHierarchy');
      spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
      spyOn(service, 'getActiveEntityIRI').and.returnValue(this.entityIRI);
      service.listItem.individuals.iris = {[this.entityIRI]: 'ontology'};
    });
    it('if is is a derived concept', function() {
      spyOn(service, 'containsDerivedConcept').and.returnValue(true);
      service.deleteIndividual();
      expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
      expect(service.listItem.individuals.iris).toEqual({});
      expect(service.getIndividualsParentPath).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
      expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
      expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
      expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
      expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.concepts, this.entityIRI);
      expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.concepts);
      expect(service.listItem.concepts.flat).toEqual([hierarchyNode]);
      expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes, this.entityIRI);
      expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes);
      expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
      expect(service.commonDelete).toHaveBeenCalledWith(this.entityIRI);
    });
    it('if it is a derived conceptScheme', function() {
      spyOn(service, 'containsDerivedConcept').and.returnValue(false);
      spyOn(service, 'containsDerivedConceptScheme').and.returnValue(true);
      service.deleteIndividual();
      expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
      expect(service.listItem.individuals.iris).toEqual({});
      expect(service.getIndividualsParentPath).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
      expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
      expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
      expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
      expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes, this.entityIRI);
      expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes);
      expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
      expect(service.commonDelete).toHaveBeenCalledWith(this.entityIRI);
    });
    it('if it is not a derived concept or conceptScheme', function() {
      spyOn(service, 'containsDerivedConcept').and.returnValue(false);
      spyOn(service, 'containsDerivedConceptScheme').and.returnValue(false);
      service.deleteIndividual();
      expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
      expect(service.listItem.individuals.iris).toEqual({});
      expect(service.getIndividualsParentPath).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
      expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
      expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
      expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
      expect(service.deleteEntityFromHierarchy).not.toHaveBeenCalled();
      expect(service.flattenHierarchy).not.toHaveBeenCalled();
      expect(service.listItem.concepts.flat).toEqual([]);
      expect(service.listItem.conceptSchemes.flat).toEqual([]);
      expect(service.commonDelete).toHaveBeenCalledWith('IndivB1');
    });
  });
  it('deleteConcept should call the proper methods', function() {
    service.listItem = listItem;
    const entityIRI = 'iri';
    spyOn(service, 'commonDelete').and.returnValue(of(null));
    spyOn(service, 'deleteEntityFromHierarchy');
    spyOn(service, 'getActiveEntityIRI').and.returnValue(entityIRI);
    spyOn(service, 'getIndividualsParentPath').and.returnValue(['ClassA', 'ClassB']);
    service.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
    service.listItem.classesAndIndividuals = {
      'ClassA': ['IndivA1', 'IndivA2'],
      'ClassB': [entityIRI]
    };
    service.listItem.selected = {
      '@id': '',
      '@type': ['ClassB']
    };
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
    service.listItem.concepts.iris = {[entityIRI]: 'ontology'};
    service.listItem.individuals.iris = {[entityIRI]: 'ontology'};
    service.deleteConcept();
    expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.concepts, entityIRI);
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.concepts);
    expect(service.listItem.concepts.flat).toEqual([hierarchyNode]);
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes, entityIRI);
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes);
    expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
    expect(service.listItem.individuals.iris).toEqual({});
    expect(service.listItem.concepts.iris).toEqual({});
    expect(service.getIndividualsParentPath).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
    expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
    expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
    expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
    expect(service.commonDelete).toHaveBeenCalledWith(entityIRI);
  });
  it('deleteConceptScheme should call the proper methods', function() {
    service.listItem = listItem;
    const entityIRI = 'iri';
    spyOn(service, 'commonDelete').and.returnValue(of(null));
    spyOn(service, 'deleteEntityFromHierarchy');
    spyOn(service, 'getActiveEntityIRI').and.returnValue(entityIRI);
    spyOn(service, 'getIndividualsParentPath').and.returnValue(['ClassA', 'ClassB']);
    service.listItem.classesWithIndividuals = ['ClassA', 'ClassB'];
    service.listItem.classesAndIndividuals = {
      'ClassA': ['IndivA1', 'IndivA2'],
      'ClassB': [entityIRI]
    };
    service.listItem.selected = {
      '@id': '',
      '@type': ['ClassB']
    };
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
    service.listItem.individuals.iris = {[entityIRI]: 'ontology'};
    service.listItem.conceptSchemes.iris = {[entityIRI]: 'ontology'};
    service.deleteConceptScheme();
    expect(service.getActiveEntityIRI).toHaveBeenCalledWith();
    expect(service.deleteEntityFromHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes, entityIRI);
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes);
    expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
    expect(service.listItem.individuals.iris).toEqual({});
    expect(service.listItem.conceptSchemes.iris).toEqual({});
    expect(service.getIndividualsParentPath).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individualsParentPath).toEqual(['ClassA', 'ClassB']);
    expect(service.listItem.classesWithIndividuals).toEqual(['ClassA']);
    expect(service.listItem.classesAndIndividuals).toEqual({'ClassA': ['IndivA1', 'IndivA2']});
    expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
    expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
    expect(service.commonDelete).toHaveBeenCalledWith(entityIRI);
  });
  describe('getBlankNodeValue returns', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.blankNodes = {'_:genid1': 'value1'};
    });
    it('value for the key provided contained in the object', function() {
      expect(service.getBlankNodeValue('_:genid1')).toEqual(service.listItem.blankNodes['_:genid1']);
    });
    it('key for the key provided not contained in the object', function() {
      expect(service.getBlankNodeValue('_:genid2')).toEqual('_:genid2');
    });
    it('undefined if isBlankNodeId returns false', function() {
      expect(service.getBlankNodeValue('key1')).toEqual(undefined);
    });
  });
  describe('isLinkable returns proper value', function() {
    it('when existsInListItem exists and isBlankNodeId is false', function() {
      spyOn(service, 'existsInListItem').and.returnValue(true);
      expect(service.isLinkable('iri')).toEqual(true);
      expect(service.existsInListItem).toHaveBeenCalledWith('iri', service.listItem);
    });
    it('when existsInListItem is undefined and isBlankNodeId is false', function() {
      spyOn(service, 'existsInListItem').and.returnValue(false);
      expect(service.isLinkable('iri')).toEqual(false);
      expect(service.existsInListItem).toHaveBeenCalledWith('iri', service.listItem);
    });
    it('when existsInListItem exists and isBlankNodeId is true', function() {
      spyOn(service, 'existsInListItem').and.returnValue(true);
      expect(service.isLinkable('_:genid1')).toEqual(false);
      expect(service.existsInListItem).toHaveBeenCalledWith('_:genid1', service.listItem);
    });
    it('when existsInListItem is undefined and isBlankNodeId is true', function() {
      spyOn(service, 'existsInListItem').and.returnValue(false);
      expect(service.isLinkable('_:genid1')).toEqual(false);
      expect(service.existsInListItem).toHaveBeenCalledWith('_:genid1', service.listItem);
    });
  });
  describe('saveCurrentChanges should call the proper methods when', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.additions = difference.additions as JSONLDObject[];
      service.listItem.deletions = difference.deletions as JSONLDObject[];
      spyOn(service, 'setEntityUsages');
    });
    describe('updateInProgressCommit resolves', function() {
      beforeEach(function() {
        catalogManagerStub.updateInProgressCommit.and.returnValue(of(null));
      });
      describe('and getInProgressCommit resolves', function() {
        describe('and inProgressCommit is empty', function() {
          beforeEach(function() {
            catalogManagerStub.getInProgressCommit.and.returnValue(of(new Difference()));
          });
          describe('and deleteInProgressCommit resolves', function() {
            beforeEach(function() {
              catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
            });
            describe('and getStateByRecordId is empty', function() {
              beforeEach(function() {
                spyOn(service, 'getStateByRecordId').and.returnValue(undefined);
                spyOn(service, 'updateState');
              });
              describe('and createState resolves', function() {
                beforeEach(function() {
                  spyOn(service, 'createState').and.returnValue(of(null));
                });
                it('if getActiveKey is not project and getActiveEntityIRI is defined', fakeAsync(function() {
                  const id = 'id';
                  spyOn(service, 'getActiveKey').and.returnValue('');
                  spyOn(service, 'getActiveEntityIRI').and.returnValue(id);
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.updateState).not.toHaveBeenCalled();
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).toHaveBeenCalledWith(id, service.listItem);
                }));
                it('if getActiveKey is project', fakeAsync(function() {
                  spyOn(service, 'getActiveKey').and.returnValue('project');
                  spyOn(service, 'getActiveEntityIRI');
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.updateState).not.toHaveBeenCalled();
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).not.toHaveBeenCalled();
                }));
                it('if getActiveKey is individuals', fakeAsync(function() {
                  spyOn(service, 'getActiveKey').and.returnValue('individuals');
                  spyOn(service, 'getActiveEntityIRI');
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.updateState).not.toHaveBeenCalled();
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).not.toHaveBeenCalled();
                }));
                it('if getActiveEntityIRI is undefined', fakeAsync(function() {
                  spyOn(service, 'getActiveEntityIRI').and.returnValue(undefined);
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.updateState).not.toHaveBeenCalled();
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).not.toHaveBeenCalled();
                }));
              });
              it('and createState rejects', fakeAsync(function() {
                spyOn(service, 'getActiveEntityIRI');
                spyOn(service, 'createState').and.returnValue(throwError(error));
                service.saveCurrentChanges()
                  .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(!has(service.listItem.editorTabStates.tab, 'usages')).toBe(true);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
                expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
            });
            describe('and getStateByRecordId is present', function() {
              beforeEach(function() {
                spyOn(service, 'getStateByRecordId').and.returnValue({id: 'id', model: []});
                spyOn(service, 'createState');
              });
              describe('and updateState resolves', function() {
                beforeEach(function() {
                  spyOn(service, 'updateState').and.returnValue(of(null));
                });
                it('if getActiveKey is not project and getActiveEntityIRI is defined', fakeAsync(function() {
                  const id = 'id';
                  spyOn(service, 'getActiveKey').and.returnValue('');
                  spyOn(service, 'getActiveEntityIRI').and.returnValue(id);
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).not.toHaveBeenCalled();
                  expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).toHaveBeenCalledWith(id, service.listItem);
                }));
                it('if getActiveKey is project', fakeAsync(function() {
                  spyOn(service, 'getActiveKey').and.returnValue('project');
                  spyOn(service, 'getActiveEntityIRI');
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).not.toHaveBeenCalled();
                  expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).not.toHaveBeenCalled();
                }));
                it('if getActiveKey is individuals', fakeAsync(function() {
                  spyOn(service, 'getActiveKey').and.returnValue('individuals');
                  spyOn(service, 'getActiveEntityIRI');
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).not.toHaveBeenCalled();
                  expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).not.toHaveBeenCalled();
                }));
                it('if getActiveEntityIRI is undefined', fakeAsync(function() {
                  spyOn(service, 'getActiveEntityIRI').and.returnValue(undefined);
                  service.saveCurrentChanges()
                    .subscribe(() => {}, () => {
                      fail('Observable should have resolved');
                    });
                  tick();
                  expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                  expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(service.listItem.inProgressCommit).toEqual(new Difference());
                  expect(service.listItem.additions).toEqual([]);
                  expect(service.listItem.deletions).toEqual([]);
                  expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                  expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                  expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                  expect(service.createState).not.toHaveBeenCalled();
                  expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                  expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                  expect(service.setEntityUsages).not.toHaveBeenCalled();
                }));
              });
              it('and updateState rejects', fakeAsync(function() {
                spyOn(service, 'updateState').and.returnValue(throwError(error));
                spyOn(service, 'getActiveEntityIRI');
                service.saveCurrentChanges()
                  .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(new Difference());
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(!has(service.listItem.editorTabStates.tab, 'usages')).toBe(true);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId });
                expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
            });
          });
          it('and deleteInProgressCommit rejects', fakeAsync(function() {
            spyOn(service, 'getStateByRecordId');
            spyOn(service, 'createState');
            spyOn(service, 'updateState');
            spyOn(service, 'getActiveEntityIRI');
            catalogManagerStub.deleteInProgressCommit.and.returnValue(throwError(error));
            service.saveCurrentChanges()
              .subscribe(() => fail('Observable should have rejected'), response => {
                expect(response).toEqual(error);
              });
            tick();
            expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
            expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
            expect(service.listItem.inProgressCommit).toEqual(new Difference());
            expect(service.listItem.additions).toEqual([]);
            expect(service.listItem.deletions).toEqual([]);
            expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
            expect(service.getStateByRecordId).not.toHaveBeenCalled();
            expect(service.createState).not.toHaveBeenCalled();
            expect(service.updateState).not.toHaveBeenCalled();
            expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
            expect(service.setEntityUsages).not.toHaveBeenCalled();
          }));
        });
        describe('and inProgressCommit has changes', function() {
          beforeEach(function() {
            catalogManagerStub.getInProgressCommit.and.returnValue(of(difference));
          });
          describe('and getStateByRecordId is empty', function() {
            beforeEach(function() {
              spyOn(service, 'getStateByRecordId').and.returnValue(undefined);
              spyOn(service, 'updateState');
            });
            describe('and createState resolves', function() {
              beforeEach(function() {
                spyOn(service, 'createState').and.returnValue(of(null));
              });
              it('if getActiveKey is not project and getActiveEntityIRI is defined', fakeAsync(function() {
                const id = 'id';
                spyOn(service, 'getActiveKey').and.returnValue('');
                spyOn(service, 'getActiveEntityIRI').and.returnValue(id);
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).toHaveBeenCalledWith(id, service.listItem);
              }));
              it('if getActiveKey is project', fakeAsync(function() {
                spyOn(service, 'getActiveKey').and.returnValue('project');
                spyOn(service, 'getActiveEntityIRI');
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
              it('if getActiveKey is individuals', fakeAsync(function() {
                spyOn(service, 'getActiveKey').and.returnValue('individuals');
                spyOn(service, 'getActiveEntityIRI');
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
              it('if getActiveEntityIRI is undefined', fakeAsync(function() {
                spyOn(service, 'getActiveEntityIRI').and.returnValue(undefined);
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.updateState).not.toHaveBeenCalled();
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
            });
            it('and createState rejects', fakeAsync(function() {
              spyOn(service, 'createState').and.returnValue(throwError(error));
              spyOn(service, 'getActiveEntityIRI');
              service.saveCurrentChanges()
                .subscribe(() => fail('Observable should have rejected'), response => {
                  expect(response).toEqual(error);
                });
              tick();
              expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
              expect(service.listItem.inProgressCommit).toEqual(difference);
              expect(service.listItem.additions).toEqual([]);
              expect(service.listItem.deletions).toEqual([]);
              expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
              expect(!has(service.listItem.editorTabStates.tab, 'usages')).toBe(true);
              expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
              expect(service.createState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
              expect(service.updateState).not.toHaveBeenCalled();
              expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
              expect(service.setEntityUsages).not.toHaveBeenCalled();
            }));
          });
          describe('and getStateByRecordId is present', function() {
            beforeEach(function() {
              spyOn(service, 'getStateByRecordId').and.returnValue({id: 'id', model: []});
              spyOn(service, 'createState');
            });
            describe('and updateState resolves', function() {
              beforeEach(function() {
                spyOn(service, 'updateState').and.returnValue(of(null));
              });
              it('if getActiveKey is not project and getActiveEntityIRI is defined', fakeAsync(function() {
                const id = 'id';
                spyOn(service, 'getActiveKey').and.returnValue('');
                spyOn(service, 'getActiveEntityIRI').and.returnValue(id);
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).toHaveBeenCalledWith(id, service.listItem);
              }));
              it('if getActiveKey is project', fakeAsync(function() {
                spyOn(service, 'getActiveKey').and.returnValue('project');
                spyOn(service, 'getActiveEntityIRI');
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
              it('if getActiveKey is individuals', fakeAsync(function() {
                spyOn(service, 'getActiveKey').and.returnValue('individuals');
                spyOn(service, 'getActiveEntityIRI');
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
              it('if getActiveEntityIRI is undefined', fakeAsync(function() {
                spyOn(service, 'getActiveEntityIRI').and.returnValue(undefined);
                service.saveCurrentChanges()
                  .subscribe(() => {}, () => {
                    fail('Observable should have resolved');
                  });
                tick();
                expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
                expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
                expect(service.listItem.inProgressCommit).toEqual(difference);
                expect(service.listItem.additions).toEqual([]);
                expect(service.listItem.deletions).toEqual([]);
                expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
                expect(has(service.listItem.editorTabStates, 'usages')).toBe(false);
                expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
                expect(service.createState).not.toHaveBeenCalled();
                expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
                expect(service.getActiveEntityIRI).toHaveBeenCalledWith(service.listItem);
                expect(service.setEntityUsages).not.toHaveBeenCalled();
              }));
            });
            it('and updateState rejects', fakeAsync(function() {
              spyOn(service, 'updateState').and.returnValue(throwError(error));
              spyOn(service, 'getActiveEntityIRI');
              service.saveCurrentChanges()
                .subscribe(() => fail('Observable should have rejected'), response => {
                  expect(response).toEqual(error);
                });
              tick();
              expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
              expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
              expect(service.listItem.inProgressCommit).toEqual(difference);
              expect(service.listItem.additions).toEqual([]);
              expect(service.listItem.deletions).toEqual([]);
              expect(catalogManagerStub.deleteInProgressCommit).not.toHaveBeenCalled();
              expect(!has(service.listItem.editorTabStates.tab, 'usages')).toBe(true);
              expect(service.getStateByRecordId).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId);
              expect(service.createState).not.toHaveBeenCalled();
              expect(service.updateState).toHaveBeenCalledWith({recordId: service.listItem.versionedRdfRecord.recordId, commitId: service.listItem.versionedRdfRecord.commitId, branchId: service.listItem.versionedRdfRecord.branchId});
              expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
              expect(service.setEntityUsages).not.toHaveBeenCalled();
            }));
          });
        });
      });
      it('when getInProgressCommit rejects', fakeAsync(function() {
        spyOn(service, 'getStateByRecordId');
        spyOn(service, 'createState');
        spyOn(service, 'updateState');
        spyOn(service, 'getActiveEntityIRI');
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(error));
        service.saveCurrentChanges()
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId);
        expect(service.getStateByRecordId).not.toHaveBeenCalled();
        expect(service.createState).not.toHaveBeenCalled();
        expect(service.updateState).not.toHaveBeenCalled();
        expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
        expect(service.setEntityUsages).not.toHaveBeenCalled();
      }));
    });
    it('updateInProgressCommit rejects', fakeAsync(function() {
      spyOn(service, 'getStateByRecordId');
      spyOn(service, 'createState');
      spyOn(service, 'updateState');
      spyOn(service, 'getActiveEntityIRI');
      catalogManagerStub.updateInProgressCommit.and.returnValue(throwError(error));
      service.saveCurrentChanges()
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, catalogId, difference);
      expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
      expect(service.getStateByRecordId).not.toHaveBeenCalled();
      expect(service.createState).not.toHaveBeenCalled();
      expect(service.updateState).not.toHaveBeenCalled();
      expect(service.getActiveEntityIRI).not.toHaveBeenCalled();
      expect(service.setEntityUsages).not.toHaveBeenCalled();
    }));
  });
  describe('updateLabel sets the label correctly', function() {
    beforeEach(function() {
      service.listItem = listItem;
      listItem.entityInfo = {
        iri: {
          label: 'old-value',
          names: ['old-value']
        }
      };
      ontologyManagerStub.getEntityName.and.returnValue('new-value');
      ontologyManagerStub.getEntityNames.and.returnValue(['new-value']);
      ontologyManagerStub.isClass.and.returnValue(false);
      ontologyManagerStub.isDataTypeProperty.and.returnValue(false);
      ontologyManagerStub.isObjectProperty.and.returnValue(false);
      ontologyManagerStub.isAnnotation.and.returnValue(false);
      ontologyManagerStub.isConcept.and.returnValue(false);
      ontologyManagerStub.isConceptScheme.and.returnValue(false);
      spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    });
    describe('when the listItem.entityInfo contains the selected @id', function() {
      beforeEach(function() {
        service.listItem.selected = {
          '@id': 'iri'
        };
      });
      it('and isClass is true', function() {
        ontologyManagerStub.isClass.and.returnValue(true);
        service.updateLabel();
        expect(ontologyManagerStub.isClass).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isDataTypeProperty).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isObjectProperty).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isAnnotation).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConcept).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConceptScheme).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(service.listItem.entityInfo.iri.label).toEqual('new-value');
        expect(service.listItem.entityInfo.iri.names).toEqual(['new-value']);
        expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.classes);
        expect(service.listItem.classes.flat).toEqual([hierarchyNode]);
      });
      it('and isDataTypeProperty is true', function() {
        ontologyManagerStub.isDataTypeProperty.and.returnValue(true);
        service.updateLabel();
        expect(ontologyManagerStub.isClass).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isObjectProperty).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isAnnotation).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConcept).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConceptScheme).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(service.listItem.entityInfo.iri.label).toEqual('new-value');
        expect(service.listItem.entityInfo.iri.names).toEqual(['new-value']);
        expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.dataProperties);
        expect(service.listItem.dataProperties.flat).toEqual([hierarchyNode]);
      });
      it('and isObjectProperty is true', function() {
        ontologyManagerStub.isObjectProperty.and.returnValue(true);
        service.updateLabel();
        expect(ontologyManagerStub.isClass).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isAnnotation).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConcept).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConceptScheme).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(service.listItem.entityInfo.iri.label).toEqual('new-value');
        expect(service.listItem.entityInfo.iri.names).toEqual(['new-value']);
        expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.objectProperties);
        expect(service.listItem.objectProperties.flat).toEqual([hierarchyNode]);
      });
      it('and isAnnotation is true', function() {
        ontologyManagerStub.isAnnotation.and.returnValue(true);
        service.updateLabel();
        expect(ontologyManagerStub.isClass).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isAnnotation).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConcept).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConceptScheme).not.toHaveBeenCalledWith(service.listItem.selected);
        expect(service.listItem.entityInfo.iri.label).toEqual('new-value');
        expect(service.listItem.entityInfo.iri.names).toEqual(['new-value']);
        expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.annotations);
        expect(service.listItem.annotations.flat).toEqual([hierarchyNode]);
      });
      it('and isConcept is true', function() {
        ontologyManagerStub.isConcept.and.returnValue(true);
        service.updateLabel();
        expect(ontologyManagerStub.isClass).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isAnnotation).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConcept).toHaveBeenCalledWith(service.listItem.selected, service.listItem.derivedConcepts);
        expect(ontologyManagerStub.isConceptScheme).not.toHaveBeenCalledWith(service.listItem.selected, service.listItem.derivedConceptSchemes);
        expect(service.listItem.entityInfo.iri.label).toEqual('new-value');
        expect(service.listItem.entityInfo.iri.names).toEqual(['new-value']);
        expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.concepts);
        expect(service.listItem.concepts.flat).toEqual([hierarchyNode]);
      });
      it('and isConceptScheme is true', function() {
        ontologyManagerStub.isConceptScheme.and.returnValue(true);
        service.updateLabel();
        expect(ontologyManagerStub.isClass).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isDataTypeProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isObjectProperty).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isAnnotation).toHaveBeenCalledWith(service.listItem.selected);
        expect(ontologyManagerStub.isConcept).toHaveBeenCalledWith(service.listItem.selected, service.listItem.derivedConcepts);
        expect(ontologyManagerStub.isConceptScheme).toHaveBeenCalledWith(service.listItem.selected, service.listItem.derivedConceptSchemes);
        expect(service.listItem.entityInfo.iri.label).toEqual('new-value');
        expect(service.listItem.entityInfo.iri.names).toEqual(['new-value']);
        expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.conceptSchemes);
        expect(service.listItem.conceptSchemes.flat).toEqual([hierarchyNode]);
      });
    });
    it('when the listItem.entityInfo does not contain the selected @id', function() {
      service.listItem.selected = {'@id': 'other-iri'};
      service.updateLabel();
      expect(service.listItem.entityInfo.iri.label).toEqual('old-value');
      expect(service.listItem.entityInfo.iri.names).toEqual(['old-value']);
    });
  });
  describe('checkIri should return correct values when the IRI is', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.iriList.push('id');
    });
    it('not a duplicate and not selected.', function() {
      expect(service.checkIri('newIri')).toEqual(false);
    });
    it('a duplicate and not selected.', function() {
      service.listItem.selected = {'@id': 'newIri'};
      expect(service.checkIri('id')).toEqual(true);
    });
    it('not a duplicate and there is an IRI selected.', function() {
      service.listItem.selected = {'@id': 'id'};
      expect(service.checkIri('newIri')).toEqual(false);
    });
    it('a duplicate and is selected.', function() {
      service.listItem.selected = {'@id': 'id'};
      expect(service.checkIri('id')).toEqual(false);
    });
  });
  // TODO: test for getDuplicateValidator
  it('setSuperClasses should call the correct methods', function() {
    service.listItem = listItem;
    const classIRIs = ['classId1', 'classId2'];
    spyOn(service, 'addEntityToHierarchy');
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    service.setSuperClasses('iri', classIRIs);
    classIRIs.forEach(value => {
      expect(service.addEntityToHierarchy).toHaveBeenCalledWith(service.listItem.classes, 'iri', value);
    });
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.classes);
    expect(service.listItem.classes.flat).toEqual([hierarchyNode]);
  });
  describe('updateFlatIndividualsHierarchy should call the correct methods when getPathsTo', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    it('has paths', function() {
      const classIRIs = ['class1', 'class2'];
      spyOn(service, 'getPathsTo').and.callFake((hierarchyInfo, iri) => [['default', iri]]);
      spyOn(service, 'createFlatIndividualTree').and.returnValue([hierarchyNode]);
      service.updateFlatIndividualsHierarchy(classIRIs);
      classIRIs.forEach(classIRI => {
        expect(service.getPathsTo).toHaveBeenCalledWith(service.listItem.classes, classIRI);
      });
      expect(service.listItem.individualsParentPath).toEqual(['default', 'class1', 'class2']);
      expect(service.createFlatIndividualTree).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.individuals.flat).toEqual([hierarchyNode]);
    });
    it('does not have paths', function() {
      spyOn(service, 'getPathsTo');
      spyOn(service, 'createFlatIndividualTree');
      service.updateFlatIndividualsHierarchy([]);
      expect(service.getPathsTo).not.toHaveBeenCalled();
      expect(service.createFlatIndividualTree).not.toHaveBeenCalled();
    });
  });
  it('setSuperProperties should call the correct methods', function() {
    service.listItem = listItem;
    const propertyIRIs = ['classId1', 'classId2'];
    spyOn(service, 'addEntityToHierarchy');
    spyOn(service, 'flattenHierarchy').and.returnValue([hierarchyNode]);
    service.setSuperProperties('iri', propertyIRIs, 'dataProperties');
    propertyIRIs.forEach(value => {
      expect(service.addEntityToHierarchy).toHaveBeenCalledWith(service.listItem.dataProperties, 'iri', value);
    });
    expect(service.flattenHierarchy).toHaveBeenCalledWith(service.listItem.dataProperties);
    expect(service.listItem.dataProperties.flat).toEqual([hierarchyNode]);
  });
  describe('getSelectList should return the correct value when getName is', function() {
    it('not provided', function() {
      spyOn(service, 'getEntityName').and.callFake(a => a);
      expect(service.getSelectList(['first', 'second'], 'I')).toEqual(['first']);
      expect(service.getEntityName).toHaveBeenCalledWith('first');
      expect(service.getEntityName).toHaveBeenCalledWith('second');
    });
    it('provided', function() {
      const getName = jasmine.createSpy('getName').and.callFake(a => a);
      expect(service.getSelectList(['first', 'second'], 'I', getName)).toEqual(['first']);
      expect(getName).toHaveBeenCalledWith('first');
      expect(getName).toHaveBeenCalledWith('second');
    });
  });
  describe('getGroupedSelectList should return the correct value when getName is', function() {
    it('not provided', function() {
      spyOn(service, 'getEntityName').and.callFake(a => a);
      expect(service.getGroupedSelectList(['http://A#second', 'http://B#item1', 'http://B#item2', 'http://A#first', 'http://C#wow'], 'I')).toEqual([
        { namespace: 'http://A#', options: [
          {item: 'http://A#first', name: 'http://A#first'},
        ] },
        { namespace: 'http://B#', options: [
          {item: 'http://B#item1', name: 'http://B#item1'},
          {item: 'http://B#item2', name: 'http://B#item2'},
        ] },
      ]);
      expect(service.getEntityName).toHaveBeenCalledWith(jasmine.any(String));
    });
    it('provided', function() {
      const getName = jasmine.createSpy('getName').and.callFake(a => a);
      expect(service.getGroupedSelectList(['http://A#second', 'http://B#item1', 'http://B#item2', 'http://A#first', 'http://C#wow'], 'I', getName)).toEqual([
        { namespace: 'http://A#', options: [
          {item: 'http://A#first', name: 'http://A#first'},
        ] },
        { namespace: 'http://B#', options: [
          {item: 'http://B#item1', name: 'http://B#item1'},
          {item: 'http://B#item2', name: 'http://B#item2'},
        ] },
      ]);
      expect(getName).toHaveBeenCalledWith(jasmine.any(String));
    });
  });
  it('getRemovePropOverlayMessage should create the HTML for confirming a removal of a property value', function() {
    service.listItem = listItem;
    listItem.selected = {'@id': ''};
    spyOn(service, 'getPropValueDisplay').and.returnValue('value');
    expect(service.getRemovePropOverlayMessage('key', 0)).toEqual(`<p>Are you sure you want to remove:<br><strong>key</strong></p><p>with value:<br><strong>value</strong></p><p>from:<br><strong>${service.listItem.selected['@id']}</strong> ?</p>`);
    expect(service.getPropValueDisplay).toHaveBeenCalledWith('key', 0);
  });
  describe('getPropValueDisplay should return the correct display if the property is', function() {
    beforeEach(function() {
      service.listItem = listItem;
      this.dataProp = 'd';
      this.objProp = 'o';
      service.listItem.selected = {
        '@id': '',
        [this.dataProp]: [{'@value': 'data'}],
        [this.objProp]: [{'@id': 'obj'}]
      };
    });
    it('a datatype property', function() {
      spyOn(service, 'getBlankNodeValue');
      expect(service.getPropValueDisplay(this.dataProp, 0)).toEqual('data');
    });
    describe('an object property and the value is', function() {
      it('a blank node', function() {
        spyOn(service, 'getBlankNodeValue').and.returnValue('blank node');
        expect(service.getPropValueDisplay(this.objProp, 0)).toEqual('blank node');
      });
      it('not a blank node', function() {
        spyOn(service, 'getBlankNodeValue');
        expect(service.getPropValueDisplay(this.objProp, 0)).toEqual('obj');
      });
    });
  });
  describe('removeProperty calls the correct methods', function() {
    beforeEach(function() {
      service.listItem = listItem;
      service.listItem.selected = {'@id': ''};
      service.listItem.flatEverythingTree = [];
      spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
      spyOn(service, 'updateLabel');
      spyOn(service, 'removePropertyFromClass');
      spyOn(service, 'updatePropertyIcon');
      spyOn(service, 'addToDeletions');
      this.index = 0;
      this.key = 'test';
      ontologyManagerStub.entityNameProps = [`${DCTERMS}title`];
      spyOn(service, 'createFlatEverythingTree').and.returnValue([hierarchyNode]);
    });
    it('if the selected key is rdfs:range', fakeAsync(function() {
      this.key = `${RDFS}range`;
      service.listItem.selected[this.key] = [{'@id': 'id'}];
      service.removeProperty(this.key, this.index)
        .subscribe(response => {
          expect(response).toEqual({'@id': 'id'});
        });
      tick();
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
      expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
      expect(service.saveCurrentChanges).toHaveBeenCalledWith();
      expect(service.updateLabel).not.toHaveBeenCalled();
      expect(service.updatePropertyIcon).toHaveBeenCalledWith(service.listItem.selected);
      expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
      expect(service.listItem.flatEverythingTree).toEqual([]);
    }));
    it('if the selected key is rdfs:domain', fakeAsync(function() {
      this.key = `${RDFS}domain`;
      service.listItem.selected[this.key] = [{'@id': 'id'}];
      service.removeProperty(this.key, this.index)
        .subscribe(response => {
          expect(response).toEqual({'@id': 'id'});
        });
      tick();
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
      expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
      expect(service.saveCurrentChanges).toHaveBeenCalledWith();
      expect(service.updateLabel).not.toHaveBeenCalled();
      expect(service.updatePropertyIcon).not.toHaveBeenCalled();
      expect(service.createFlatEverythingTree).toHaveBeenCalledWith(service.listItem);
      expect(service.listItem.flatEverythingTree).toEqual([hierarchyNode]);
    }));
    it('if the selected key is a name prop', fakeAsync(function() {
      this.key = `${DCTERMS}title`;
      service.listItem.selected[this.key] = [{'@id': 'id'}];
      service.removeProperty(this.key, this.index)
        .subscribe(response => {
          expect(response).toEqual({'@id': 'id'});
        });
      tick();
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
      expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
      expect(service.saveCurrentChanges).toHaveBeenCalledWith();
      expect(service.updateLabel).toHaveBeenCalledWith();
      expect(service.updatePropertyIcon).not.toHaveBeenCalled();
      expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
      expect(service.listItem.flatEverythingTree).toEqual([]);
    }));
    it('if the selected key is not a name prop', fakeAsync(function() {
      service.listItem.selected[this.key] = [{'@id': 'id'}];
      service.removeProperty(this.key, this.index)
        .subscribe(response => {
          expect(response).toEqual({'@id': 'id'});
        });
      tick();
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, jasmine.any(Object));
      expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
      expect(service.saveCurrentChanges).toHaveBeenCalledWith();
      expect(service.updateLabel).not.toHaveBeenCalled();
      expect(service.updatePropertyIcon).not.toHaveBeenCalled();
      expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
      expect(service.listItem.flatEverythingTree).toEqual([]);
    }));
    describe('if the selected value is a blank node', function() {
      beforeEach(function() {
        this.expected = {'@id': service.listItem.selected['@id']};
        service.listItem.selectedBlankNodes = [{'@id': '_:genid1'}];
      });
      it('but is not present in the listItems list of selectedBlankNodes', fakeAsync(function() {
        this.key = 'http://www.w3.org/2000/01/rdf-schema#subClassOf';
        service.listItem.selected = {
          '@id': 'http://mobi.inovexcorp.com/ontology/test/bnode#ClassC',
          '@type': [
            'http://www.w3.org/2002/07/owl#Class'
          ],
          'http://www.w3.org/2000/01/rdf-schema#subClassOf': [
            {
              '@id': 'http://mobi.com/.well-known/genid/genid-91a0b08612a24e18a7a3d528e8ba6f6916-b1'
            },
            {
              '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc834'
            }
          ]
        };
        this.expected = {
          '@id': 'http://mobi.inovexcorp.com/ontology/test/bnode#ClassC',
          'http://www.w3.org/2000/01/rdf-schema#subClassOf': [
            {
              '@id': 'http://mobi.com/.well-known/genid/genid-91a0b08612a24e18a7a3d528e8ba6f6916-b1'
            }
          ]
        };
        const originalSelectedBlankNodes = [
          {
            '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc834',
            '@type': [
              'http://www.w3.org/2002/07/owl#Class'
            ],
            'http://www.w3.org/2002/07/owl#unionOf': [
              {
                '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc835'
              }
            ]
          },
          {
            '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc835',
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#first': [
              {
                '@id': 'http://mobi.inovexcorp.com/ontology/test/bnode#ClassA'
              }
            ],
            'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest': [
              {
                '@list': [
                  {
                    '@id': 'http://mobi.inovexcorp.com/ontology/test/bnode#ClassB'
                  }
                ]
              }
            ]
          }
        ];
        service.listItem.selectedBlankNodes = cloneDeep(originalSelectedBlankNodes);
        service.removeProperty(this.key, this.index)
          .subscribe(response => {
            expect(response).toEqual({'@id': 'http://mobi.com/.well-known/genid/genid-91a0b08612a24e18a7a3d528e8ba6f6916-b1'});
          });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, this.expected);
        expect(service.addToDeletions).not.toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {
          '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc834',
          '@type': [
            'http://www.w3.org/2002/07/owl#Class'
          ],
          'http://www.w3.org/2002/07/owl#unionOf': [
            {
              '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc835'
            }
          ]
        });
        expect(service.addToDeletions).not.toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {
          '@id': 'http://mobi.com/.well-known/genid/6f99109121ce471c99176fcd6bdcdc835',
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#first': [
            {
              '@id': 'http://mobi.inovexcorp.com/ontology/test/bnode#ClassA'
            }
          ],
          'http://www.w3.org/1999/02/22-rdf-syntax-ns#rest': [
            {
              '@list': [
                {
                  '@id': 'http://mobi.inovexcorp.com/ontology/test/bnode#ClassB'
                }
              ]
            }
          ]
        });
        expect(service.listItem.selectedBlankNodes).toEqual(originalSelectedBlankNodes);
        expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.updateLabel).not.toHaveBeenCalled();
        expect(service.updatePropertyIcon).not.toHaveBeenCalled();
        expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
        expect(service.listItem.flatEverythingTree).toEqual([]);
      }));
      it('and the selected key is rdfs:domain', fakeAsync(function() {
        this.key = `${RDFS}domain`;
        service.listItem.selected[this.key] = [{'@id': '_:genid1'}];
        this.expected[this.key] = [{'@id': '_:genid1'}];
        service.removeProperty(this.key, this.index)
          .subscribe(response => {
            expect(response).toEqual({'@id': '_:genid1'});
          });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, this.expected);
        expect(service.listItem.selectedBlankNodes).toEqual([]);
        expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.updateLabel).not.toHaveBeenCalled();
        expect(service.updatePropertyIcon).not.toHaveBeenCalled();
        expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
        expect(service.listItem.flatEverythingTree).toEqual([]);
      }));
      it('and the selected key is not rdf:domain', fakeAsync(function() {
        service.listItem.selected[this.key] = [{'@id': '_:genid1'}];
        this.expected[this.key] = [{'@id': '_:genid1'}];
        service.removeProperty(this.key, this.index)
          .subscribe(response => {
            expect(response).toEqual({'@id': '_:genid1'});
          });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, this.expected);
        expect(service.listItem.selectedBlankNodes).toEqual([]);
        expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.updateLabel).not.toHaveBeenCalled();
        expect(service.updatePropertyIcon).not.toHaveBeenCalled();
        expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
        expect(service.listItem.flatEverythingTree).toEqual([]);
      }));
      it('and the blank node has some transitive blank nodes', fakeAsync(function() {
        service.listItem.selected[this.key] = [{'@id': '_:bnode0'}];
        service.listItem.selectedBlankNodes = [{
          '@id': '_:bnode0',
          propA: [{'@id': '_:bnode1'}]
        }, {
          '@id': '_:bnode1'
        }, {
          '@id': '_:bnode2'
        }];
        this.expected[this.key] = [{'@id': '_:bnode0'}];
        service.removeProperty(this.key, this.index)
          .subscribe(response => {
            expect(response).toEqual({'@id': '_:bnode0'});
          });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, this.expected);
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {
          '@id': '_:bnode0',
          propA: [{'@id': '_:bnode1'}]
        });
        expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {'@id': '_:bnode1'});
        expect(service.addToDeletions).not.toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, {'@id': '_:bnode2'});
        expect(service.listItem.selectedBlankNodes).toEqual([{'@id': '_:bnode2'}]);
        expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, this.key, this.index);
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.updateLabel).not.toHaveBeenCalled();
        expect(service.updatePropertyIcon).not.toHaveBeenCalled();
        expect(service.createFlatEverythingTree).not.toHaveBeenCalled();
        expect(service.listItem.flatEverythingTree).toEqual([]);
      }));
    });
  });
  it('openSnackbar should open a snackbar for the provided entity IRI', fakeAsync(function() {
    spyOn(service, 'goTo');
    spyOn(service, 'getEntityName').and.returnValue('Name');
    service.listItem = new OntologyListItem();
    service.openSnackbar('iri');
    tick();
    expect(snackBarStub.open).toHaveBeenCalledWith('Name successfully created', 'Open', { duration: 5500 });
    expect(onActionSpy).toHaveBeenCalledWith();
    expect(afterDismissedSpy).toHaveBeenCalledWith();
    expect(service.goTo).toHaveBeenCalledWith('iri');
    expect(service.listItem.openSnackbar).toBeUndefined();
  }));
});
