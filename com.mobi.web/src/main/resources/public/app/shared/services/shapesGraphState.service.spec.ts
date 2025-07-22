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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';

import { MockPipe, MockProvider } from 'ng-mocks';
import { Subject, of, throwError } from 'rxjs';
import { cloneDeep, concat, map } from 'lodash';

import { CATALOG, DCTERMS, OWL, RDF, SH, SHAPESGRAPHEDITOR, XSD } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { Difference } from '../models/difference.class';
import { EntityNames } from '../models/entityNames.interface';
import { EventWithPayload } from '../models/eventWithPayload.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { ManchesterConverterService } from './manchesterConverter.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { PolicyManagerService } from './policyManager.service';
import { PrefixationPipe } from '../pipes/prefixation.pipe';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { PropertyManagerService } from './propertyManager.service';
import { PropertyShape } from '../../shapes-graph-editor/models/property-shape.interface';
import { RdfDownload } from '../models/rdfDownload.interface';
import { RdfUpload } from '../models/rdfUpload.interface';
import { SettingManagerService } from './settingManager.service';
import { SHAPES_STORE_TYPE } from '../../constants';
import { ShapesGraphListItem } from '../models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from './shapesGraphManager.service';
import { SparqlManagerService } from './sparqlManager.service';
import { StateManagerService } from './stateManager.service';
import { ToastService } from './toast.service';
import { UpdateRefsService } from './updateRefs.service';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphStateService } from './shapesGraphState.service';

describe('Shapes Graph State service', function() {
  let service: ShapesGraphStateService;
  let _catalogManagerActionSubject: Subject<EventWithPayload>;
  let _mergeRequestManagerActionSubject: Subject<EventWithPayload>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let manchesterConverterStub: jasmine.SpyObj<ManchesterConverterService>;
  let mergeRequestManagerServiceStub: jasmine.SpyObj<MergeRequestManagerService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
  let prefixationStub: jasmine.SpyObj<PrefixationPipe>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
  let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
  let sparqlManagerStub: jasmine.SpyObj<SparqlManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let updateRefsStub: jasmine.SpyObj<UpdateRefsService>;

  let exclusionList: string[] = [];

  const catalogId = 'catalogId';
  const recordId = 'recordId';
  const branchId = 'branchId';
  const commitId = 'commitId';
  const masterBranchIri = 'masterBranchIri';
  const shapesGraphId = 'shapesGraphId';
  const tagId = 'tagId';
  const title = 'title';
  const recordTitle = 'recordTitle';
  const difference: Difference = new Difference([{ '@id': 'add' }], [{ '@id': 'del' }]);
  const error = 'Error Message';
  const file = new File([''], 'filename', { type: 'text/html' });
  const uploadResponse: VersionedRdfUploadResponse = Object.freeze({
    recordId: 'recordId',
    branchId: 'branchId',
    commitId: 'commitId',
    title: 'title',
    shapesGraphId: 'shapesGraphId'
  });
  let listItem: ShapesGraphListItem;
  const shapeGraphRecordObj: JSONLDObject = Object.freeze({
    '@id': shapesGraphId,
    '@type': [`${OWL}ShapeGraphRecord`]
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ShapesGraphStateService,
        MockProvider(CatalogManagerService),
        MockProvider(ManchesterConverterService),
        MockProvider(MergeRequestManagerService),
        MockProvider(ProgressSpinnerService),
        MockProvider(PolicyEnforcementService),
        MockProvider(PolicyManagerService),
        MockProvider(PropertyManagerService),
        MockProvider(SettingManagerService),
        MockProvider(ShapesGraphManagerService),
        MockProvider(SparqlManagerService),
        MockProvider(StateManagerService),
        MockProvider(ToastService),
        { provide: PrefixationPipe, useClass: MockPipe(PrefixationPipe) },
        MockProvider(UpdateRefsService)
      ]
    }).compileComponents();
    settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
    sparqlManagerStub = TestBed.inject(SparqlManagerService) as jasmine.SpyObj<SparqlManagerService>;
    updateRefsStub = TestBed.inject(UpdateRefsService) as jasmine.SpyObj<UpdateRefsService>;
    shapesGraphManagerStub = TestBed.inject(ShapesGraphManagerService) as jasmine.SpyObj<ShapesGraphManagerService>;
    shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(of(uploadResponse));
    manchesterConverterStub = TestBed.inject(ManchesterConverterService) as jasmine.SpyObj<ManchesterConverterService>;
    manchesterConverterStub.jsonldToManchester.and.callFake(a => a);
    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    policyEnforcementStub.permit = 'Permit';
    policyEnforcementStub.deny = 'Deny';
    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
    policyManagerStub = TestBed.inject(PolicyManagerService) as jasmine.SpyObj<PolicyManagerService>;
    policyManagerStub.actionModify = 'Modify';
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    prefixationStub = TestBed.inject(PrefixationPipe) as jasmine.SpyObj<PrefixationPipe>;
    prefixationStub.transform.and.callFake(a => a);
    
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

    mergeRequestManagerServiceStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = { '@id': catalogId, '@type': [] };

    _catalogManagerActionSubject = new Subject<EventWithPayload>();
    _mergeRequestManagerActionSubject = new Subject<EventWithPayload>();
    catalogManagerStub.catalogManagerAction$ = _catalogManagerActionSubject.asObservable();
    mergeRequestManagerServiceStub.mergeRequestAction$ = _mergeRequestManagerActionSubject.asObservable();

    listItem = new ShapesGraphListItem();
    listItem.shapesGraphId = shapesGraphId;
    listItem.versionedRdfRecord = {
      title: 'recordTitle',
      recordId,
      commitId,
      branchId
    };
    listItem.masterBranchIri = masterBranchIri;
    listItem.userCanModify = true;
    listItem.userCanModifyMaster = true;
    propertyManagerStub.defaultDatatypes = concat(
      map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => {
        listItem.dataPropertyRange[XSD + item] = XSD.slice(0, -1);
        return XSD + item;
      }),
      map(['langString'], item => {
        listItem.dataPropertyRange[RDF + item] = RDF.slice(0, -1);
        return RDF + item;
      })
    );
    service = TestBed.inject(ShapesGraphStateService);
    service.initialize();

    exclusionList = [
      'element',
      'usagesElement',
      'branches',
      'tags',
      'failedImports',
      'openSnackbar',
      'versionedRdfRecord',
      'merge',
      'selectedCommit',
      'nodes'
    ];
  });

  afterEach(function() {
    cleanStylesFromDOM();
    service = null;
    _catalogManagerActionSubject = null;
    _mergeRequestManagerActionSubject = null;
    catalogManagerStub = null;
    listItem = null;
    manchesterConverterStub = null;
    policyEnforcementStub = null;
    policyManagerStub = null;
    progressSpinnerStub = null;
    settingManagerStub = null;
    shapesGraphManagerStub = null;
    sparqlManagerStub = null;
    toastStub = null;
    updateRefsStub = null;
  });

  it('initialize works properly', function() {
    expect(service['catalogId']).toEqual(catalogId);
  });
  it('getDefaultNamespace provides the default namespace to be used for new shapes graphs', fakeAsync(function() {
    settingManagerStub.getDefaultNamespace.and.returnValue(of('shapes-graph'));
    service.getDefaultNamespace().subscribe(value => {
      expect(value).toEqual('shapes-graph');
    });
    tick();
    expect(settingManagerStub.getDefaultNamespace).toHaveBeenCalledWith(`${SHAPESGRAPHEDITOR}ShapesGraphRecord`);
  }));
  it('should retrieve the name of an entity for shapes graphs', function() {
    listItem.entityInfo = {
      'http://test.com/AnotherEntity': {
        label: 'Another',
        names: ['Blah']
      },
      'http://test.com/MissingLabel': {
        label: '',
        names: []
      }
    };
    service.listItem = listItem;
    expect(service.getEntityName('http://test.com/TestEntity')).toEqual('Test Entity');
    expect(service.getEntityName('http://test.com/MissingLabel')).toEqual('Missing Label');
    expect(service.getEntityName('http://test.com/AnotherEntity')).toEqual('Another');
  });
  describe('getIdentifierIRI retrieves the shapes graph IRI of a ShapesGraphRecord', function() {
    it('if provided JSON-LD', function() {
      expect(service.getIdentifierIRI({
        '@id': 'recordId',
        [`${CATALOG}trackedIdentifier`]: [{ '@id': 'shapesGraphIRI' }]
      })).toEqual('shapesGraphIRI');
    });
    it('from the current listItem', function() {
      service.listItem = listItem;
      service.listItem.shapesGraphId = 'shapesGraphIRI';
      expect(service.getIdentifierIRI()).toEqual('shapesGraphIRI');
    });
  });
  describe('open should call the proper methods', function() {
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
      it('and createListItem resolves', fakeAsync(function() {
        spyOn(service, 'createListItem').and.returnValue(of(listItem));
        spyOn(service, 'setSelected').and.returnValue(of(null));
        service.open({ recordId, title, identifierIRI: shapesGraphId })
          .subscribe(() => { }, () => fail('Observable should have resolved'));
        tick();
        expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, true, title);
        expect(service.listItem).toEqual(listItem);
        expect(service.list).toContain(listItem);
      }));
      it('and createListItem rejects', fakeAsync(function() {
        spyOn(service, 'createListItem').and.returnValue(throwError(error));
        service.open({ recordId, title, identifierIRI: shapesGraphId })
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, true, title);
        expect(service.listItem).toBeUndefined();
        expect(service.list).toEqual([]);
      }));
    });
    it('and getCatalogDetails rejects', fakeAsync(function() {
      spyOn(service, 'getCatalogDetails').and.returnValue(throwError(error));
      service.open({ recordId, title, identifierIRI: shapesGraphId })
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
    }));
  });
  describe('create makes a new shapes graph record without opening it', function() {
    it('unless no file or JSON-LD was provided', fakeAsync(function() {
      service.create({ title: '' }).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).not.toHaveBeenCalled();
    }));
    it('if a file is provided', fakeAsync(function() {
      const uploadDetails: RdfUpload = { title: '', file };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails, true);
    }));
    it('if JSON-LD is provided', fakeAsync(function() {
      const uploadDetails: RdfUpload = { title: '', jsonld: [{ '@id': 'shapesGraph' }] };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails, true);
    }));
  });
  describe('createAndOpen calls the correct methods', function() {
    beforeEach(function() {
      service.list = [];
    });
    it('unless no file or JSON-LD was provided', fakeAsync(function() {
      service.createAndOpen({ title: '' }).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).not.toHaveBeenCalled();
    }));
    describe('if a file was provided', function() {
      const uploadDetails: RdfUpload = { title, description: 'description', keywords: ['A', 'B'], file };
      describe('when uploadOntology succeeds', function() {
        describe('and createListItem succeeds', function() {
          beforeEach(function() {
            spyOn(service, 'setSelected').and.returnValue(of(null));
            spyOn(service, 'createListItem').and.returnValue(of(listItem));
          });
          it('and createState resolves', fakeAsync(function() {
            spyOn(service, 'createState').and.returnValue(of(null));
            service.createAndOpen(uploadDetails)
              .subscribe(response => {
                expect(response).toEqual({
                  recordId,
                  branchId,
                  commitId,
                  shapesGraphId,
                  title: listItem.versionedRdfRecord.title
                });
              }, () => fail('Observable should have resolved'));
            tick();
            expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
            expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, title);
            expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
            expect(service.list.length).toBe(1);
            expect(service.listItem).toEqual(listItem);
          }));
          it('and createState rejects', fakeAsync(function() {
            spyOn(service, 'createState').and.returnValue(throwError(error));
            service.createAndOpen({ title, description: 'description', keywords: ['A', 'B'], file })
              .subscribe(() => fail('Observable should have rejected'), response => {
                expect(response).toEqual(error);
              });
            tick();
            expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
            expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, title);
            expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
            expect(service.list.length).toBe(0);
            expect(service.listItem).toBeUndefined();
          }));
        });
        it('when createListItem rejects', fakeAsync(function() {
          spyOn(service, 'createListItem').and.returnValue(throwError(error));
          spyOn(service, 'createState');
          service.createAndOpen(uploadDetails)
            .subscribe(() => fail('Observable should have rejected'), response => {
              expect(response).toEqual(error);
            });
          tick();
          expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, title);
          expect(service.createState).not.toHaveBeenCalled();
          expect(service.list.length).toBe(0);
          expect(service.listItem).toBeUndefined();
        }));
      });
      it('when uploadOntology rejects', fakeAsync(function() {
        spyOn(service, 'createListItem');
        spyOn(service, 'createState');
        shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(throwError(error));
        service.createAndOpen(uploadDetails)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
        expect(service.createListItem).not.toHaveBeenCalled();
        expect(service.createState).not.toHaveBeenCalled();
        expect(service.list.length).toBe(0);
        expect(service.listItem).toBeUndefined();
      }));
    });
    describe('if JSON-LD was provided', function() {
      const uploadDetails: RdfUpload = { title, description: 'description', keywords: ['A', 'B'], jsonld: [shapeGraphRecordObj] };
      beforeEach(function() {
        spyOn(service, 'createListItem').and.returnValue(of(listItem));
      });
      describe('when uploadOntology succeeds', function() {
        it('and createState resolves', fakeAsync(function() {
          spyOn(service, 'setSelected').and.returnValue(of(null));
          spyOn(service, 'createState').and.returnValue(of(null));
          service.createAndOpen(uploadDetails)
            .subscribe(response => {
              expect(response).toEqual({
                recordId,
                branchId,
                commitId,
                shapesGraphId,
                title: recordTitle
              });
            }, () => fail('Observable should have resolved'));
          tick();
          expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, uploadResponse.title);
          expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
          expect(service.setSelected).toHaveBeenCalledWith('shapesGraphId', listItem);
          expect(service.list.length).toBe(1);
          expect(service.listItem).toBeDefined();
          expect(service.listItem.shapesGraphId).toEqual(shapesGraphId);
          expect(service.listItem.masterBranchIri).toEqual(masterBranchIri);
          expect(service.listItem.userCanModify).toBeTrue();
          expect(service.listItem.userCanModifyMaster).toBeTrue();
        }));
        it('and createState rejects', fakeAsync(function() {
          spyOn(service, 'createState').and.returnValue(throwError(error));
          service.createAndOpen(uploadDetails)
            .subscribe(() => fail('Observable should have rejected'), response => {
              expect(response).toEqual(error);
            });
          tick();
          expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, new Difference(), true, uploadResponse.title);
          expect(service.createState).toHaveBeenCalledWith({ branchId, recordId, commitId });
          expect(service.list.length).toBe(0);
          expect(service.listItem).toBeUndefined();
        }));
      });
      it('when uploadOntology rejects', fakeAsync(function() {
        spyOn(service, 'createState');
        shapesGraphManagerStub.createShapesGraphRecord.and.returnValue(throwError(error));
        service.createAndOpen(uploadDetails)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails);
        expect(service.createListItem).not.toHaveBeenCalled();
        expect(service.createState).not.toHaveBeenCalled();
        expect(service.list.length).toBe(0);
        expect(service.listItem).toBeUndefined();
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
          await service.delete('recordId')
            .subscribe(() => { }, () => fail('Observable should have succeeded'));
          expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith('recordId', catalogId);
        });
        it('unless an error occurs', async function() {
          catalogManagerStub.deleteRecord.and.returnValue(throwError(error));
          await service.delete('recordId')
            .subscribe(() => {
              fail('Observable should have rejected');
            }, response => {
              expect(response).toEqual(error);
            });
          expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith('recordId', catalogId);
        });
      });
      it('unless an error occurs', async function() {
        this.deleteStateSpy.and.returnValue(throwError(error));
        await service.delete('recordId')
          .subscribe(() => {
            fail('Observable should have rejected');
          }, response => {
            expect(response).toEqual(error);
          });
        expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
        expect(catalogManagerStub.deleteRecord).not.toHaveBeenCalled();
      });
    });
  });
  it('download submits a download of a shapes graph record', function() {
    const rdfDownload: RdfDownload = {
      recordId: ''
    };
    service.download(rdfDownload);
    expect(shapesGraphManagerStub.downloadShapesGraph).toHaveBeenCalledWith(rdfDownload);
  });
  describe('removeChanges should call the proper methods', function() {
    beforeEach(function() {
      service.listItem = listItem;
    });
    describe('when deleteInProgressCommit succeeds', function() {
      beforeEach(function() {
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
      });
      it('and changeVersion succeeds', fakeAsync(function() {
        spyOn(service, 'changeVersion').and.returnValue(of(null));
        service.removeChanges().subscribe(() => { }, () => fail('Observable should have resolved'));
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, listItem.upToDate, true, listItem.changesPageOpen);
      }));
      it('and changeVersion rejects', fakeAsync(function() {
        spyOn(service, 'changeVersion').and.returnValue(throwError(error));
        service.removeChanges().subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
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
      expect(service.changeVersion).not.toHaveBeenCalled();
    }));
  });
  describe('uploadChanges should call the proper methods', function() {
    beforeEach(function() {
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
    });
    describe('when uploadChangesFile resolves', function() {
      beforeEach(function() {
        shapesGraphManagerStub.uploadChanges.and.returnValue(of(null));
      });
      it('and getInProgressCommit resolves', fakeAsync(function() {
        catalogManagerStub.getInProgressCommit.and.returnValue(of(difference));
        spyOn(service, 'changeVersion').and.returnValue(of(null));
        listItem.upToDate = true;
        service.uploadChanges({ file, recordId, branchId, commitId }).subscribe(() => { }, () => fail('Observable should have resolved'));
        tick();
        expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith({ file, recordId, branchId, commitId });
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.getListItemByRecordId).toHaveBeenCalledWith(recordId);
        expect(listItem.inProgressCommit).toEqual(difference);
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, true, false, listItem.changesPageOpen);
      }));
      it('and getInProgressCommit rejects', fakeAsync(function() {
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(error));
        spyOn(service, 'changeVersion');
        listItem.upToDate = true;
        service.uploadChanges({ file, recordId, branchId, commitId }).subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual({ errorMessage: error, errorDetails: [] });
        });
        tick();
        expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith({ file, recordId, branchId, commitId });
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.getListItemByRecordId).not.toHaveBeenCalled();
        expect(service.changeVersion).not.toHaveBeenCalled();
      }));
    });
    it('when uploadChangesFile rejects', fakeAsync(function() {
      shapesGraphManagerStub.uploadChanges.and.returnValue(throwError(error));
      spyOn(service, 'changeVersion');
      service.uploadChanges({ file, recordId, branchId, commitId }).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual({ errorMessage: error, errorDetails: [] });
      });
      tick();
      expect(shapesGraphManagerStub.uploadChanges).toHaveBeenCalledWith({ file, recordId, branchId, commitId });
      expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
      expect(service.getListItemByRecordId).not.toHaveBeenCalled();
      expect(service.changeVersion).not.toHaveBeenCalled();
    }));
  });
  describe('changeVersion should call the proper methods when', function() {
    beforeEach(function() {
      this.oldListItem = cloneDeep(listItem);
      this.oldListItem.tabIndex = 1;
      this.oldListItem.inProgressCommit = difference;
      spyOn(service, 'getListItemByRecordId').and.returnValue(this.oldListItem);
    });
    describe('updateState resolves', function() {
      beforeEach(function() {
        spyOn(service, 'updateState').and.returnValue(of(null));
      });
      describe('and createListItem resolves', function() {
        beforeEach(function() {
          spyOn(service, 'createListItem').and.returnValue(of(listItem));
        });
        it('and the in progress commit should be cleared with the same version title', fakeAsync(function() {
          const versionTitle = this.oldListItem.currentVersionTitle;
          service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, true, true)
            .subscribe(() => { }, () => fail('Observable should have resolved'));
          tick();
          expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, new Difference(), listItem.upToDate, listItem.versionedRdfRecord.title);
          expect(this.oldListItem.changesPageOpen).toBeTrue();
          expect(this.oldListItem.currentVersionTitle).toEqual(versionTitle);
        }));
        it('and the in progress commit should not be cleared with a new version title', fakeAsync(function() {
          service.changeVersion(recordId, branchId, commitId, tagId, 'New Title', listItem.upToDate, false, false)
            .subscribe(() => { }, () => fail('Observable should have resolved'));
          tick();
          expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
          expect(this.oldListItem.changesPageOpen).toBeFalse();
          expect(this.oldListItem.currentVersionTitle).toEqual('New Title');
        }));
      });
      it('and createListItem rejects', fakeAsync(function() {
        spyOn(service, 'createListItem').and.returnValue(throwError(error));
        service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, false, false)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error);
          });
        tick();
        expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
        expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
      }));
    });
    it('and updateState rejects', fakeAsync(function() {
      this.oldListItem.ontologyId = 'old';
      spyOn(service, 'updateState').and.returnValue(throwError(error));
      spyOn(service, 'createListItem');
      service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, false, false)
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
      expect(service.createListItem).not.toHaveBeenCalled();
    }));
  });
  describe('should merge shapes graph branches', function() {
    beforeEach(function() {
      service.list = [listItem]
      service.listItem = listItem;
      service.listItem.versionedRdfRecord.recordId = 'recordId';
      service.listItem.versionedRdfRecord.branchId = 'sourceBranchId';
      service.listItem.merge.target = {
        '@id': 'targetBranchId',
        '@type': [],
        [`${DCTERMS}title`]: [{ '@value': 'branchTitle' }]
      };
      this.changeVersionSpy = spyOn(service, 'changeVersion').and.returnValue(of(null));
      catalogManagerStub.deleteRecordBranch.and.returnValue(of(null));
      catalogManagerStub.mergeBranches.and.returnValue(of('commitId'));
    });
    describe('and should change the shapes graph version to the target branch', function() {
      describe('and handle if the checkbox is', function() {
        it('checked', async function() {
          service.listItem.merge.checkbox = true;
          await service.merge()
            .subscribe(() => {
              expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalogId', new Difference(), []);
              expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
              expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', 'sourceBranchId', catalogId);
            }, () => fail('Observable should have succeeded'));
        });
        it('unchecked', async function() {
          service.listItem.merge.checkbox = false;
          await service.merge()
            .subscribe(() => {
              expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalogId', new Difference(), []);
              expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
              expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
            }, () => fail('Observable should have succeeded'));
        });
      });
      it('unless an error occurs', async function() {
        this.changeVersionSpy.and.returnValue(throwError('Error'));
        await service.merge()
          .subscribe(() => {
            fail('Observable should have errored');
          }, response => {
            expect(response).toEqual('Error');
            expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalogId', new Difference(), []);
            expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
            expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
          });
      });
    });
    it('unless an error occurs', async function() {
      catalogManagerStub.mergeBranches.and.returnValue(throwError('Error'));
      await service.merge()
        .subscribe(() => {
          fail('Observable should have rejected');
        }, response => {
          expect(response).toEqual('Error');
          expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalogId', new Difference(), []);
          expect(this.changeVersionSpy).not.toHaveBeenCalled();
          expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
          expect(this.changeVersionSpy).not.toHaveBeenCalled();
        });
    });
  });
  describe('should create a listItem', () => {
    const branches: JSONLDObject[] = [
      { '@id': branchId, [`${DCTERMS}title`]: [{ '@value': 'Other Branch'}] },
      { '@id': masterBranchIri, [`${DCTERMS}title`]: [{ '@value': 'MASTER' }] }
    ];
    const entityNames: EntityNames = {
      'urn:test': { label: 'Test', names: [] }
    };
    beforeEach(() => {
      shapesGraphManagerStub.getShapesGraphImports.and.returnValue(of({
        nonImportedIris: ['class'],
        failedImports: ['failed'],
        importedOntologies: [
          { id: 'other-record', ontologyId: 'other-ont', iris: ['other-class'] }
        ]
      }));
      shapesGraphManagerStub.getShapesGraphContent.and.returnValue(of('content'));
      catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({ body: branches })))
    });
    describe('if getShapesGraphIRI succeeds', () => {
      beforeEach(() => {
        shapesGraphManagerStub.getShapesGraphIRI.and.returnValue(of(shapesGraphId));
      });
      describe('with all first requests passing', () => {
        let expectedListItem: ShapesGraphListItem;
        beforeEach(() => {
          expectedListItem = cloneDeep(listItem);
          expectedListItem.versionedRdfRecord.tagId = tagId;
          expectedListItem.failedImports = ['failed'];
          expectedListItem.importedOntologyIds = ['other-record'];
          expectedListItem.importedOntologies = [{ id: 'other-record', ontologyId: 'other-ont' }];
          expectedListItem.subjectImportMap = {
            'other-class': { imported: true, alsoLocal: false, ontologyIds: ['other-ont'] },
            'class': { imported: false, alsoLocal: true }
          };
          expectedListItem.content = 'content';
          expectedListItem.entityInfo = entityNames;
          expectedListItem.userCanModifyMaster = false;
          spyOn(service, 'getEntityNames').and.returnValue(of(entityNames));
        });
        afterEach(() => {
          expectedListItem = undefined;
        });
        it('successfully', fakeAsync(() => {
          expectedListItem.userCanModifyMaster = true;
          service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
            result => {
              expect(result).toEqual(expectedListItem);
            }, () => fail('Observable should have rejected'));
          tick();
          expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
          expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
          expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
            resourceId: recordId,
            actionId: policyManagerStub.actionModify
          });
          expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
            resourceId: recordId,
            actionId: policyManagerStub.actionModify,
            actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
          });
        }));
        it('unless evaluateRequest fails', fakeAsync(() => {
          policyEnforcementStub.evaluateRequest.and.callFake(obj => {
            if (obj.actionAttrs) {
              return throwError(error);
            } else {
              return of(policyEnforcementStub.permit);
            }
          });
          service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
            () => fail('Observable should have rejected'), result => {
              expect(result).toEqual(error);
            });
          tick();
          expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
          expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
          expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
            resourceId: recordId,
            actionId: policyManagerStub.actionModify
          });
          expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
            resourceId: recordId,
            actionId: policyManagerStub.actionModify,
            actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
          });
        }));
      });
      it('unless getEntityNames fails', fakeAsync(() => {
        spyOn(service, 'setSelected').and.returnValue(of(null));
        spyOn(service, 'getEntityNames').and.returnValue(throwError(error));
        service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
          () => fail('Observable should have rejected'), result => {
            expect(result).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify
        });
        expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
        expect(service.setSelected).not.toHaveBeenCalled();
        expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
        });
      }));
      it('unless evaluateRequest fails', fakeAsync(() => {
        spyOn(service, 'setSelected').and.returnValue(of(null));
        spyOn(service, 'getEntityNames').and.returnValue(of(entityNames));
        policyEnforcementStub.evaluateRequest.and.returnValue(throwError(error));
        service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
          () => fail('Observable should have rejected'), result => {
            expect(result).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify
        });
        expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
        expect(service.setSelected).not.toHaveBeenCalled();
        expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
        });
      }));
      it('unless getRecordBranches fails', fakeAsync(() => {
        spyOn(service, 'setSelected').and.returnValue(of(null));
        spyOn(service, 'getEntityNames').and.returnValue(of(entityNames));
        catalogManagerStub.getRecordBranches.and.returnValue(throwError(error));
        service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
          () => fail('Observable should have rejected'), result => {
            expect(result).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify
        });
        expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
        expect(service.setSelected).not.toHaveBeenCalled();
        expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
        });
      }));
      it('unless getShapesGraphContent fails', fakeAsync(() => {
        spyOn(service, 'setSelected').and.returnValue(of(null));
        spyOn(service, 'getEntityNames').and.returnValue(of(entityNames));
        shapesGraphManagerStub.getShapesGraphContent.and.returnValue(throwError(error));
        service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
          () => fail('Observable should have rejected'), result => {
            expect(result).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify
        });
        expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
        expect(service.setSelected).not.toHaveBeenCalled();
        expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
        });
      }));
      it('unless getShapesGraphImports fails', fakeAsync(() => {
        spyOn(service, 'setSelected').and.returnValue(of(null));
        spyOn(service, 'getEntityNames').and.returnValue(of(entityNames));
        shapesGraphManagerStub.getShapesGraphImports.and.returnValue(throwError(error));
        service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
          () => fail('Observable should have rejected'), result => {
            expect(result).toEqual(error);
          });
        tick();
        expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(shapesGraphManagerStub.getShapesGraphContent).toHaveBeenCalledWith(recordId, branchId, commitId);
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(recordId, catalogId);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify
        });
        expect(service.getEntityNames).toHaveBeenCalledWith(jasmine.any(ShapesGraphListItem));
        expect(service.setSelected).not.toHaveBeenCalled();
        expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalledWith({
          resourceId: recordId,
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
        });
      }));
    });
    it('unless getShapesGraphIRI fails', fakeAsync(() => {
      spyOn(service, 'setSelected').and.returnValue(of(null));
      spyOn(service, 'getEntityNames').and.returnValue(of(entityNames));
      shapesGraphManagerStub.getShapesGraphIRI.and.returnValue(throwError(error));
      service.createListItem(recordId, branchId, commitId, tagId, new Difference(), true, recordTitle).subscribe(
        () => fail('Observable should have rejected'), result => {
          expect(result).toEqual(error);
        });
      tick();
      expect(shapesGraphManagerStub.getShapesGraphIRI).toHaveBeenCalledWith(recordId, branchId, commitId);
      expect(shapesGraphManagerStub.getShapesGraphContent).not.toHaveBeenCalled();
      expect(catalogManagerStub.getRecordBranches).not.toHaveBeenCalled();
      expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalled();
      expect(service.getEntityNames).not.toHaveBeenCalledWith();
      expect(service.setSelected).not.toHaveBeenCalled();
    }));
  });
  describe('onIriEdit calls the appropriate manager methods', function() {
    const iriBegin = 'www.example.com/test-record';
    const iriThen = '/';
    const iriEnd = 'shapes-test';
    const newIRI = iriBegin + iriThen + iriEnd;
    beforeEach(function() {
      const metadata = {
        '@id': 'www.example.com/test-record/shapes',
        '@type': ['http://www.w3.org/2002/07/owl#Ontology'],
      };
      service.listItem = listItem;
      service.listItem.versionedRdfRecord.recordId = 'recordId';
      service.listItem.versionedRdfRecord.branchId = 'branchId';
      service.listItem.versionedRdfRecord.commitId = 'commitId';
      service.listItem.selected = metadata;
      service.list.push(service.listItem);
    });
    it('When there are already additions with the previous IRI', fakeAsync(function() {
      service.listItem.additions = [{
        '@id': 'www.example.com/test-record/shapes',
        '@type': ['http://www.w3.org/2002/07/owl#Ontology'],
        'http://purl.org/dc/elements/1.1/title': [{ '@value': 'UHTC Shapes Graph' }]
      }];
      sparqlManagerStub.postQuery.and.returnValue(of('[]'));
      service.onIriEdit(iriBegin, iriThen, iriEnd).subscribe();
      tick();

      expect(service.listItem.additions.length).toEqual(1);
      expect(service.listItem.deletions.length).toEqual(0);
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), 'recordId', 'shapes-graph-record',
        'branchId', 'commitId', false, false, 'jsonld');
      expect(updateRefsStub.update).toHaveBeenCalledWith(service.listItem, 'www.example.com/test-record/shapes',
        newIRI, exclusionList);
    }));
    it('When no usages are found', fakeAsync(function() {
      sparqlManagerStub.postQuery.and.returnValue(of('[]'));
      service.onIriEdit(iriBegin, iriThen, iriEnd).subscribe();
      tick();

      expect(service.listItem.additions.length).toEqual(1);
      expect(service.listItem.deletions.length).toEqual(1);
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), 'recordId', 'shapes-graph-record',
        'branchId', 'commitId', false, false, 'jsonld');
      expect(updateRefsStub.update).toHaveBeenCalledWith(service.listItem, 'www.example.com/test-record/shapes',
        newIRI, exclusionList);
    }));
    it('When retrieveUsages method throws an error', fakeAsync(function() {
      spyOn(service, 'addToAdditions');
      spyOn(service, 'addToDeletions');
      sparqlManagerStub.postQuery.and.returnValue(throwError('Error'));
      service.onIriEdit(iriBegin, iriThen, iriEnd)
        .subscribe(() => fail('Observable should not have resolved'), () => { });
      tick();

      expect(service.addToAdditions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, Object.assign({}, service.listItem.selected));
      expect(service.addToDeletions).toHaveBeenCalledWith(service.listItem.versionedRdfRecord.recordId, Object.assign({}, service.listItem.selected));
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), 'recordId', 'shapes-graph-record',
        'branchId', 'commitId', false, false, 'jsonld');
      expect(updateRefsStub.update).toHaveBeenCalledWith(service.listItem, 'www.example.com/test-record/shapes',
        newIRI, exclusionList);
    }));
    it('When retrieveUsages method resolves', fakeAsync(function() {
      const usages = `[ {
        "@id" : "_:genid-f008989dbffa42c28d08087aacb415c738-464BF00DDBF1492E53EF0EBAD7F08536",
        "http://www.w3.org/2000/01/rdf-schema#isDefinedBy" : [ {
          "@id" : "www.example.com/test-record/shapes"
        } ]
      }, {
        "@id" : "http://schema.org/ElementShape",
        "http://www.w3.org/2000/01/rdf-schema#isDefinedBy" : [ {
          "@id" : "www.example.com/test-record/shapes"
        } ]
      }, {
        "@id" : "http://schema.org/MaterialShape",
        "http://www.w3.org/2000/01/rdf-schema#isDefinedBy" : [ {
          "@id" : "www.example.com/test-record/shapes"
        } ]
      } ]`;

      sparqlManagerStub.postQuery.and.returnValue(of(usages));
      service.onIriEdit(iriBegin, iriThen, iriEnd).subscribe();
      tick();
      expect(service.listItem.additions.length).toEqual(4);
      expect(service.listItem.deletions.length).toEqual(4);
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), 'recordId', 'shapes-graph-record',
        'branchId', 'commitId', false, false, 'jsonld');
      expect(updateRefsStub.update).toHaveBeenCalledWith(service.listItem, 'www.example.com/test-record/shapes',
        newIRI, exclusionList);
    }));
  });
  // TODO: Add test for setSelected
  // TODO: Add test for getPropValueDisplay
  // TODO: Add test for removeProperty
  // TODO: Add test for isSelectedImported
  // TODO: Add test for isImported
  // TODO: Add test for checkIri
  // TODO: Add test for getImportedSource
  describe('should retrieve entity names from the shapes graph record', () => {
    it('successfully', fakeAsync(() => {
      sparqlManagerStub.postQuery.and.returnValue(of({
        head: {
          vars: ['iri', 'names']
        },
        results: {
          bindings: [
            {
              iri: {
                value: 'urn:test',
                type: `${XSD}string`
              },
              names: {
                value: 'Test�Testing�WOW',
                type: `${XSD}string`
              }
            },
            {
              iri: {
                value: 'urn:example',
                type: `${XSD}string`
              },
              names: {
                value: 'Example',
                type: `${XSD}string`
              }
            }
          ]
        }
      }));
      service.getEntityNames(listItem).subscribe(result => {
        expect(result).toEqual({
          'urn:test': {
            label: 'Test',
            names: ['Test', 'Testing', 'WOW']
          },
          'urn:example': {
            label: 'Example',
            names: ['Example']
          }
        });
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), recordId, SHAPES_STORE_TYPE, branchId, commitId, true, true);
    }));
    it('unless an error occurs', fakeAsync(() => {
      sparqlManagerStub.postQuery.and.returnValue(throwError(error));
      service.getEntityNames(listItem).subscribe(() => fail('Observable should have failed'), result => {
        expect(result).toEqual(error);
      });
      tick();
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), recordId, SHAPES_STORE_TYPE, branchId, commitId, true, true);
    }));
  });
  describe('should remove the provided PropertyShape', () => {
    const referencedNodeIds = new Set(['_:b2', '_:b3']);
    const nodeShapeId = 'urn:nodeShape';
    beforeEach(() => {
      service.listItem = listItem;
      service.listItem.selected = {
        '@id': nodeShapeId,
      };
      service.listItem.selectedBlankNodes = [
        { '@id': '_:b2' },
        { '@id': '_:b3' },
        { '@id': '_:b4' },
      ];
      spyOn(service, 'addToDeletions');
    });
    describe('if the property shape has a blank node id', () => {
      const propertyShape: PropertyShape = {
        id: '_:b1',
        label: '_:b1',
        jsonld: {
          '@id': '_b1',
          [`${SH}path`]: [{ '@id': '_:b2' }]
        },
        constraints: [],
        path: undefined,
        pathString: '',
        pathHtmlString: '',
        referencedNodeIds
      };
      beforeEach(() => {
        service.listItem.selected[`${SH}property`] = [{ '@id': propertyShape.id }];
      });
      it('successfully', fakeAsync(() => {
        spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
        service.removePropertyShape(propertyShape).subscribe(() => {
          expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, `${SH}property`, 0);
          expect(service.listItem.selectedBlankNodes).toEqual([{ '@id': '_:b4' }]);
          // Not expected to be there since it's a blank node
          expect(service.listItem.entityInfo[propertyShape.id]).toBeUndefined();
        }, () => fail('Observable should have succeeded'));
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
          '@id': nodeShapeId,
          [`${SH}property`]: [{ '@id': propertyShape.id }]
        });
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
        [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
        });
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
      }));
      it('unless saveCurrentChanges fails', fakeAsync(() => {
        spyOn(service, 'saveCurrentChanges').and.returnValue(throwError(error));
        service.removePropertyShape(propertyShape).subscribe(() => fail('Observable should have failed'), result => {
          expect(result).toEqual(error);
        });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
          '@id': nodeShapeId,
          [`${SH}property`]: [{ '@id': propertyShape.id }]
        });
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
        [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
        });
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
      }));
    });
    describe('if the property shape has an IRI', () => {
      const propertyShape: PropertyShape = {
        id: 'urn:PropertyShape',
        label: 'Property Shape',
        jsonld: {
          '@id': 'urn:PropertyShape',
          [`${SH}path`]: [{ '@id': '_:b2' }]
        },
        constraints: [],
        path: undefined,
        pathString: '',
        pathHtmlString: '',
        referencedNodeIds
      };
      beforeEach(() => {
        service.listItem.selected[`${SH}property`] = [{ '@id': propertyShape.id }];
        service.listItem.entityInfo = {
          [propertyShape.id]: { label: propertyShape.label, names: [] }
        };
      });
      describe('if postQuery succeeds', () => {
        const usages = [{'@id': 'urn:somethingElse', 'urn:someProp': [{'@id': propertyShape.id}]}];
        it('successfully', fakeAsync(() => {
          sparqlManagerStub.postQuery.and.returnValue(of(JSON.stringify(usages)));
          spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
          service.removePropertyShape(propertyShape).subscribe(() => {
            expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, `${SH}property`, 0);
            expect(service.listItem.selectedBlankNodes).toEqual([{ '@id': '_:b4' }]);
            expect(service.listItem.entityInfo[propertyShape.id]).toBeUndefined();
          }, () => fail('Observable should have succeeded'));
          tick();
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
            '@id': nodeShapeId,
            [`${SH}property`]: [{ '@id': propertyShape.id }]
          });
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
          [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
            expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
          });
          usages.forEach(obj => {
            expect(service.addToDeletions).toHaveBeenCalledWith(recordId, obj);
          });
          expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), recordId, 'shapes-graph-record',
            branchId, commitId, false, false, 'jsonld');
          expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        }));
        it('unless saveCurrentChanges fails', fakeAsync(() => {
          sparqlManagerStub.postQuery.and.returnValue(of(JSON.stringify(usages)));
          spyOn(service, 'saveCurrentChanges').and.returnValue(throwError(error));
          service.removePropertyShape(propertyShape).subscribe(() => fail('Observable should have failed'), result => {
            expect(result).toEqual(error);
            expect(propertyManagerStub.remove).not.toHaveBeenCalled();
            expect(service.listItem.selectedBlankNodes).toEqual([{ '@id': '_:b2' }, { '@id': '_:b3' }, { '@id': '_:b4' }]);
            expect(service.listItem.entityInfo[propertyShape.id]).toBeDefined();
          });
          tick();
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
            '@id': nodeShapeId,
            [`${SH}property`]: [{ '@id': propertyShape.id }]
          });
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
          [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
            expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
          });
          usages.forEach(obj => {
            expect(service.addToDeletions).toHaveBeenCalledWith(recordId, obj);
          });
          expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), recordId, 'shapes-graph-record',
            branchId, commitId, false, false, 'jsonld');
          expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        }));
        it('unless the response is not a string', fakeAsync(() => {
          sparqlManagerStub.postQuery.and.returnValue(of({ head: { vars: []}, results: {bindings: []}}));
          spyOn(service, 'saveCurrentChanges');
          service.removePropertyShape(propertyShape).subscribe(() => fail('Observable should have failed'), result => {
            expect(result).toContain('Associated usages were not updated due to an internal error');
            expect(propertyManagerStub.remove).not.toHaveBeenCalled();
            expect(service.listItem.selectedBlankNodes).toEqual([{ '@id': '_:b2' }, { '@id': '_:b3' }, { '@id': '_:b4' }]);
            expect(service.listItem.entityInfo[propertyShape.id]).toBeDefined();
          });
          tick();
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
            '@id': nodeShapeId,
            [`${SH}property`]: [{ '@id': propertyShape.id }]
          });
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
          [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
            expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
          });
          usages.forEach(obj => {
            expect(service.addToDeletions).not.toHaveBeenCalledWith(recordId, obj);
          });
          expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), recordId, 'shapes-graph-record',
            branchId, commitId, false, false, 'jsonld');
          expect(service.saveCurrentChanges).not.toHaveBeenCalled();
        }));
      });
      it('unless postQuery fails', fakeAsync(() => {
        spyOn(service, 'saveCurrentChanges');
        sparqlManagerStub.postQuery.and.returnValue(throwError(error));
        service.removePropertyShape(propertyShape).subscribe(() => fail('Observable should have failed'), result => {
          expect(result).toEqual(error);
          expect(propertyManagerStub.remove).not.toHaveBeenCalled();
          expect(service.listItem.selectedBlankNodes).toEqual([{ '@id': '_:b2' }, { '@id': '_:b3' }, { '@id': '_:b4' }]);
          expect(service.listItem.entityInfo[propertyShape.id]).toBeDefined();
        });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
          '@id': nodeShapeId,
          [`${SH}property`]: [{ '@id': propertyShape.id }]
        });
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
        [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
        });
        expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), recordId, 'shapes-graph-record',
          branchId, commitId, false, false, 'jsonld');
        expect(service.saveCurrentChanges).not.toHaveBeenCalled();
      }));
    });
  });
});