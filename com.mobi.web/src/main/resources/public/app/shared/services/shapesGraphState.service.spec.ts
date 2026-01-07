/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { ElementRef } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { cloneDeep, concat, map } from 'lodash';
import { MockPipe, MockProvider } from 'ng-mocks';
import { Observable, Subject, of, throwError } from 'rxjs';

import { BlankNodeIndex } from './versionedRdfState.service';
import { CATALOG, DCTERMS, OWL, RDF, RDFS, SH, SHAPESGRAPHEDITOR, XSD } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { Difference } from '../models/difference.class';
import { EntityNames } from '../models/entityNames.interface';
import { EventTypeConstants } from '../models/eventWithPayload.interface';
import { EventWithPayload } from '../models/eventWithPayload.interface';
import { GroupedSuggestion } from '../../shapes-graph-editor/models/grouped-suggestion';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { ManchesterConverterService } from './manchesterConverter.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { NodeShapeSummary } from '../../shapes-graph-editor/models/node-shape-summary.interface';
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
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { StateManagerService } from './stateManager.service';
import { TARGET_CLASS } from '../../shapes-graph-editor/models/constants';
import { ToastService } from './toast.service';
import { UpdateRefsService } from './updateRefs.service';
import { VersionedRdfUploadResponse } from '../models/versionedRdfUploadResponse.interface';
import { ShapesGraphStateService } from './shapesGraphState.service';

describe('Shapes Graph State service', function () {
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
  let snackBarStub: jasmine.SpyObj<MatSnackBar>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
  let shapesGraphManagerStub: jasmine.SpyObj<ShapesGraphManagerService>;
  let sparqlManagerStub: jasmine.SpyObj<SparqlManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let updateRefsStub: jasmine.SpyObj<UpdateRefsService>;

  const exclusionList: string[] = [
    'element',
    'usagesElement',
    'branches',
    'tags',
    'failedImports',
    'openSnackbar',
    'versionedRdfRecord',
    'merge',
    'selectedCommit',
    'nodes',
    '_selectedNodeShapeIri',
    'selectedNodeShapeIri$',
    'selectedNodeShapeIri',
    'additions',
    'deletions'
  ];

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

  const onActionSpy = jasmine.createSpy('onAction').and.returnValue(of(null));
  const afterDismissedSpy = jasmine.createSpy('afterDismissed').and.returnValue(of(null));

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
        {
          provide: MatSnackBar, useFactory: () => jasmine.createSpyObj('MatSnackBar', {
            open: {
              onAction: onActionSpy,
              afterDismissed: afterDismissedSpy
            }
          })
        },
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
    snackBarStub = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
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
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    mergeRequestManagerServiceStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
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
  });

  afterEach(function () {
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

  it('initialize works properly', function () {
    expect(service['catalogId']).toEqual(catalogId);
    expect(service.list).toEqual([]);
    expect(service.listItem).toBeUndefined();
  });
  describe('event handling from constructor', () => {
    beforeEach(function () {
      service.listItem = listItem;
      service.list = [listItem];
    });
    describe('when a branch removal event is received', function () {
      it('should call deleteBranchState if the record exists in the list', fakeAsync(function () {
        spyOn(service, 'deleteBranchState').and.returnValue(of(null));
        const eventPayload: EventWithPayload = {
          eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL,
          payload: { recordId: recordId, branchId: 'branch-to-delete' }
        };
        _catalogManagerActionSubject.next(eventPayload);
        tick();
        expect(service.deleteBranchState).toHaveBeenCalledWith(recordId, 'branch-to-delete');
      }));
      it('should do nothing if the record does not exist in the list', fakeAsync(function () {
        spyOn(service, 'deleteBranchState').and.returnValue(of(null));
        const eventPayload: EventWithPayload = {
          eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL,
          payload: { recordId: 'non-existent-record', branchId: 'branch-to-delete' }
        };
        _catalogManagerActionSubject.next(eventPayload);
        tick();
        expect(service.deleteBranchState).not.toHaveBeenCalled();
      }));
      it('should log a warning if recordId or branchId is missing', fakeAsync(function () {
        spyOn(console, 'warn');
        spyOn(service, 'deleteBranchState').and.returnValue(of(null));
        const eventPayload: EventWithPayload = {
          eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL,
          payload: { recordId: recordId } // missing branchId
        };
        _catalogManagerActionSubject.next(eventPayload);
        tick();
        expect(console.warn).toHaveBeenCalledWith('EVENT_BRANCH_REMOVAL is missing recordIri or branchId');
      }));
    });
    describe('when a merge request acceptance event is received', function () {
      it('should mark the listItem as out-of-date and show a toast if the target branch is the current branch', fakeAsync(function () {
        service.listItem.versionedRdfRecord.branchId = 'main';
        service.listItem.merge.active = true;
        const eventPayload: EventWithPayload = {
          eventType: EventTypeConstants.EVENT_MERGE_REQUEST_ACCEPTED,
          payload: { recordId: recordId, targetBranchId: 'main' }
        };
        _mergeRequestManagerActionSubject.next(eventPayload);
        tick();
        expect(service.listItem.upToDate).toBeFalse();
        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String), { timeOut: 5000 });
      }));
      it('should show a toast if a merge is active and its target is the affected branch', fakeAsync(function () {
        service.listItem.versionedRdfRecord.branchId = 'feature-branch';
        service.listItem.merge.active = true;
        service.listItem.merge.target = { '@id': 'main', '@type': [] };
        const eventPayload: EventWithPayload = {
          eventType: EventTypeConstants.EVENT_MERGE_REQUEST_ACCEPTED,
          payload: { recordId: recordId, targetBranchId: 'main' }
        };
        _mergeRequestManagerActionSubject.next(eventPayload);
        tick();
        expect(service.listItem.upToDate).toBeTrue();
        expect(toastStub.createWarningToast).toHaveBeenCalledTimes(1);
      }));
      it('should do nothing if the affected record is not in the list', fakeAsync(function () {
        const eventPayload: EventWithPayload = {
          eventType: EventTypeConstants.EVENT_MERGE_REQUEST_ACCEPTED,
          payload: { recordId: 'some-other-record', targetBranchId: 'main' }
        };
        _mergeRequestManagerActionSubject.next(eventPayload);
        tick();
        expect(service.listItem.upToDate).toBeTrue();
        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
      }));
    });
    describe('when an invalid event is received', function () {
      it('should create an error toast if the event has no payload', fakeAsync(function () {
        const eventPayload = {
          eventType: EventTypeConstants.EVENT_BRANCH_REMOVAL,
          payload: undefined
        };
        _catalogManagerActionSubject.next(eventPayload);
        tick();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Event type and payload is required');
      }));
      it('should log a console warning for an unknown event type', fakeAsync(function () {
        spyOn(console, 'warn');
        const unknownEvent = {
          eventType: 'unknown-event',
          payload: { recordId: '123' }
        };
        _catalogManagerActionSubject.next(unknownEvent);
        tick();
        expect(console.warn).toHaveBeenCalledWith('Event type is not valid');
      }));
    });
  });
  it('getDefaultNamespace provides the default namespace to be used for new shapes graphs', fakeAsync(function () {
    settingManagerStub.getDefaultNamespace.and.returnValue(of('shapes-graph'));
    service.getDefaultNamespace().subscribe(value => {
      expect(value).toEqual('shapes-graph');
    });
    tick();
    expect(settingManagerStub.getDefaultNamespace).toHaveBeenCalledWith(`${SHAPESGRAPHEDITOR}ShapesGraphRecord`);
  }));
  it('should retrieve the name of an entity for shapes graphs', function () {
    listItem.entityInfo = {
      'http://mobi.com/AnotherEntity': {
        label: 'Another',
        names: ['Blah']
      },
      'http://mobi.com/MissingLabel': {
        label: '',
        names: []
      }
    };
    service.listItem = listItem;
    expect(service.getEntityName('http://mobi.com/TestEntity')).toEqual('Test Entity');
    expect(service.getEntityName('http://mobi.com/MissingLabel')).toEqual('Missing Label');
    expect(service.getEntityName('http://mobi.com/AnotherEntity')).toEqual('Another');
  });
  describe('updateEntityName', () => {
    it('should update the label for an existing entity in entityInfo', () => {
      service.listItem = listItem;
      const entityId = 'http://mobi.com/MyShape';
      service.listItem.entityInfo[entityId] = { label: 'Old Label', names: [] };
      const updatedEntity = { '@id': entityId, 'prop1': [{ '@value': 'New Label' }] };
      service.updateEntityName(updatedEntity);

      expect(service.listItem.entityInfo[entityId].label).toEqual('My Shape');
    });
    it('should do nothing if the entity does not exist in entityInfo', () => {
      service.listItem = listItem;
      const originalInfo = cloneDeep(service.listItem.entityInfo);
      const updatedEntity = { '@id': 'http://mobi.com/NonExistent', 'prop1': [{ '@value': 'New Name' }] };

      service.updateEntityName(updatedEntity);
      expect(service.listItem.entityInfo).toEqual(originalInfo);
    });
  });
  describe('goTo', () => {
    const projectEntityIri = 'urn:project-entity';
    const nodeShapeIri = 'urn:node-shape';
    beforeEach(() => {
      service.listItem = cloneDeep(listItem);
      service.listItem.editorTabStates.nodeShapes.nodes = [
        { iri: nodeShapeIri, name: 'My Node Shape' } as NodeShapeSummary
      ];
      spyOn(service, 'setSelected').and.returnValue(of(null));
      spyOn(service.listItem, 'setSelectedNodeShapeIri');
    });
    it('should do nothing if listItem is not set', () => {
      service.listItem = null;
      service.goTo(projectEntityIri);
      expect(service.setSelected).not.toHaveBeenCalled();
    });
    it('should do nothing if iri is not provided', () => {
      service.goTo(null);
      expect(service.setSelected).not.toHaveBeenCalled();
    });
    it('should navigate to the project tab for a non-node-shape IRI', () => {
      service.listItem.tabIndex = ShapesGraphListItem.NODE_SHAPES_TAB_IDX;
      service.goTo(projectEntityIri);
      expect(service.listItem.tabIndex).toBe(ShapesGraphListItem.PROJECT_TAB_IDX);
      expect(service.getActivePage().entityIRI).toBe(projectEntityIri);
      expect(service.listItem.setSelectedNodeShapeIri).not.toHaveBeenCalled();
      expect(service.setSelected).toHaveBeenCalledWith(projectEntityIri);
    });
    it('should navigate to the node shapes tab for a known node shape IRI', () => {
      service.listItem.tabIndex = ShapesGraphListItem.PROJECT_TAB_IDX;
      service.goTo(nodeShapeIri);
      expect(service.listItem.tabIndex).toBe(ShapesGraphListItem.NODE_SHAPES_TAB_IDX);
      expect(service.listItem.setSelectedNodeShapeIri).toHaveBeenCalledWith(nodeShapeIri, true);
      expect(service.setSelected).toHaveBeenCalledWith(nodeShapeIri);
    });
    it('should show an error toast if setSelected fails', fakeAsync(() => {
      (service.setSelected as jasmine.Spy).and.returnValue(throwError('Failed to load'));
      spyOn(service, 'getEntityName').and.returnValue('Entity Name');
      service.goTo(projectEntityIri);
      tick();
      expect(toastStub.createErrorToast).toHaveBeenCalledWith('Failed to load entity: Entity Name');
    }));
  });
  describe('addNodeShapeSummary', () => {
    let nodeShape: JSONLDObject;
    beforeEach(() => {
      service.listItem = cloneDeep(listItem);
      service.listItem.editorTabStates.nodeShapes.nodes = [];
      spyOn(service, 'getEntityName').and.callFake(iri => {
        return `entityName(${iri})`;
      });
      nodeShape = {
        '@id': 'urn:my-shape',
        '@type': [SH + 'NodeShape']
      };
      service.shaclTargetDetector = jasmine.createSpyObj('shaclTargetDetector', ['detect']);
    });
    it('should add a summary for a node shape with a single target', () => {
      (service.shaclTargetDetector.detect as jasmine.Spy).and.returnValue({
        targetType: `${SH}targetClass`,
        value: 'urn:my-class',
        multiSelect: false
      });
      service.addNodeShapeSummary(nodeShape);

      const summaries = service.listItem.editorTabStates.nodeShapes.nodes;
      expect(summaries.length).toBe(1);
      const summary = summaries[0];
      expect(summary.iri).toEqual('urn:my-shape');
      expect(summary.name).toEqual('entityName(urn:my-shape)');
      expect(summary.targetType).toEqual(`${SH}targetClass`);
      expect(summary.targetTypeLabel).toEqual('Target Class');
      expect(summary.targetValue).toEqual('urn:my-class');
      expect(summary.targetValueLabel).toEqual('entityName(urn:my-class)');
      expect(summary.imported).toBeFalse();
      expect(summary.sourceOntologyIRI).toEqual(shapesGraphId);
    });
    it('should add a summary for a node shape with a multi-select target, using the first value', () => {
      (service.shaclTargetDetector.detect as jasmine.Spy).and.returnValue({
        targetType: `${SH}targetSubjectsOf`,
        values: ['urn:my-class', 'urn:another-class'],
        multiSelect: true
      });
      service.addNodeShapeSummary(nodeShape);

      const summaries = service.listItem.editorTabStates.nodeShapes.nodes;
      expect(summaries.length).toEqual(1);
      const summary = summaries[0];
      expect(summary.targetType).toEqual(`${SH}targetSubjectsOf`);
      expect(summary.targetValue).toEqual('urn:my-class');
      expect(summary.targetValueLabel).toEqual('entityName(urn:my-class)');
    });
    it('should handle a node shape with no target data by using default values', () => {
      (service.shaclTargetDetector.detect as jasmine.Spy).and.returnValue(null);
      service.addNodeShapeSummary(nodeShape);

      const summaries = service.listItem.editorTabStates.nodeShapes.nodes;
      expect(summaries.length).toEqual(1);
      const summary = summaries[0];
      expect(summary.targetType).toEqual('N/A');
      expect(summary.targetTypeLabel).toEqual('N/A');
      expect(summary.targetValue).toEqual('');
      expect(summary.targetValueLabel).toEqual('entityName()');
    });
    it('should add the new summary and correctly sort the list by name', () => {
      (service.shaclTargetDetector.detect as jasmine.Spy).and.returnValue(null);
      service.listItem.editorTabStates.nodeShapes.nodes = [
        { name: 'ZShape' } as NodeShapeSummary,
        { name: 'AShape' } as NodeShapeSummary
      ];
      service.addNodeShapeSummary(nodeShape);

      const summaries = service.listItem.editorTabStates.nodeShapes.nodes;
      expect(summaries.length).toEqual(3);
      const names = summaries.map(s => s.name);
      expect(names).toEqual(['AShape', 'entityName(urn:my-shape)', 'ZShape']);
    });
  });
  describe('isLinkable', () => {
    it('should always return false', () => {
      expect(service.isLinkable('urn:anyIri')).toBeFalse();
    });
  });
  describe('canModifyEntityTypes', () => {
    it('should always return false', () => {
      const entity: JSONLDObject = { '@id': 'any' };
      expect(service.canModifyEntityTypes(entity)).toBeFalse();
    });
  });
  describe('getIdentifierIRI retrieves the shapes graph IRI of a ShapesGraphRecord', function () {
    it('if provided JSON-LD', function () {
      expect(service.getIdentifierIRI({
        '@id': 'recordId',
        [`${CATALOG}trackedIdentifier`]: [{ '@id': 'shapesGraphIRI' }]
      })).toEqual('shapesGraphIRI');
    });
    it('from the current listItem', function () {
      service.listItem = listItem;
      service.listItem.shapesGraphId = 'shapesGraphIRI';
      expect(service.getIdentifierIRI()).toEqual('shapesGraphIRI');
    });
  });
  describe('open should call the proper methods', function () {
    describe('when getCatalogDetails resolves', function () {
      beforeEach(function () {
        spyOn(service, 'getCatalogDetails').and.returnValue(of({
          recordId,
          branchId,
          commitId,
          tagId,
          upToDate: true,
          inProgressCommit: difference,
        }));
      });
      it('and createListItem resolves', fakeAsync(function () {
        spyOn(service, 'createListItem').and.returnValue(of(listItem));
        spyOn(service, 'setSelected').and.returnValue(of(null));
        service.open({ recordId, title, identifierIRI: shapesGraphId })
          .subscribe(() => { }, () => fail('Observable should have resolved'));
        tick();
        expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, true, title);
        expect(service.listItem).toEqual(listItem);
        expect(service.list).toContain(listItem);
      }));
      it('and createListItem rejects', fakeAsync(function () {
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
    it('and getCatalogDetails rejects', fakeAsync(function () {
      spyOn(service, 'getCatalogDetails').and.returnValue(throwError(error));
      service.open({ recordId, title, identifierIRI: shapesGraphId })
        .subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
      tick();
    }));
  });
  describe('create makes a new shapes graph record without opening it', function () {
    it('unless no file or JSON-LD was provided', fakeAsync(function () {
      service.create({ title: '' }).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).not.toHaveBeenCalled();
    }));
    it('if a file is provided', fakeAsync(function () {
      const uploadDetails: RdfUpload = { title: '', file };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails, true);
    }));
    it('if JSON-LD is provided', fakeAsync(function () {
      const uploadDetails: RdfUpload = { title: '', jsonld: [{ '@id': 'shapesGraph' }] };
      service.create(uploadDetails).subscribe(response => {
        expect(response).toEqual(uploadResponse);
      }, () => fail('Observable should have succeeded'));
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).toHaveBeenCalledWith(uploadDetails, true);
    }));
  });
  describe('createAndOpen calls the correct methods', function () {
    beforeEach(function () {
      service.list = [];
    });
    it('unless no file or JSON-LD was provided', fakeAsync(function () {
      service.createAndOpen({ title: '' }).subscribe(() => fail('Observable should have failed'), error => {
        expect(error).toEqual('Creation requires a file or JSON-LD');
      });
      tick();
      expect(shapesGraphManagerStub.createShapesGraphRecord).not.toHaveBeenCalled();
    }));
    describe('if a file was provided', function () {
      const uploadDetails: RdfUpload = { title, description: 'description', keywords: ['A', 'B'], file };
      describe('when uploadOntology succeeds', function () {
        describe('and createListItem succeeds', function () {
          beforeEach(function () {
            spyOn(service, 'setSelected').and.returnValue(of(null));
            spyOn(service, 'createListItem').and.returnValue(of(listItem));
          });
          it('and createState resolves', fakeAsync(function () {
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
          it('and createState rejects', fakeAsync(function () {
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
        it('when createListItem rejects', fakeAsync(function () {
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
      it('when uploadOntology rejects', fakeAsync(function () {
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
    describe('if JSON-LD was provided', function () {
      const uploadDetails: RdfUpload = { title, description: 'description', keywords: ['A', 'B'], jsonld: [shapeGraphRecordObj] };
      beforeEach(function () {
        spyOn(service, 'createListItem').and.returnValue(of(listItem));
      });
      describe('when uploadOntology succeeds', function () {
        it('and createState resolves', fakeAsync(function () {
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
        it('and createState rejects', fakeAsync(function () {
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
      it('when uploadOntology rejects', fakeAsync(function () {
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
  describe('delete deletes a shapes graph', function () {
    beforeEach(function () {
      this.deleteStateSpy = spyOn(service, 'deleteState').and.returnValue(of(null));
    });
    describe('first deleting the state', function () {
      describe('then deleting the record', function () {
        it('successfully', function () {
          catalogManagerStub.deleteRecord.and.returnValue(of(null));
          service.delete('recordId')
            .subscribe(() => {
            }, () => fail('Observable should have succeeded'));
          expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith('recordId', catalogId);
        });
        it('unless an error occurs', function () {
          catalogManagerStub.deleteRecord.and.returnValue(throwError(error));
          service.delete('recordId')
            .subscribe(() => {
              fail('Observable should have rejected');
            }, response => {
              expect(response).toEqual(error);
            });
          expect(this.deleteStateSpy).toHaveBeenCalledWith('recordId');
          expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith('recordId', catalogId);
        });
      });
      it('unless an error occurs', function () {
        this.deleteStateSpy.and.returnValue(throwError(error));
        service.delete('recordId')
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
  it('download submits a download of a shapes graph record', function () {
    const rdfDownload: RdfDownload = {
      recordId: ''
    };
    service.download(rdfDownload);
    expect(shapesGraphManagerStub.downloadShapesGraph).toHaveBeenCalledWith(rdfDownload);
  });
  describe('removeChanges should call the proper methods', function () {
    beforeEach(function () {
      service.listItem = listItem;
    });
    describe('when deleteInProgressCommit succeeds', function () {
      beforeEach(function () {
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
      });
      it('and changeVersion succeeds', fakeAsync(function () {
        spyOn(service, 'changeVersion').and.returnValue(of(null));
        service.removeChanges().subscribe(() => { }, () => fail('Observable should have resolved'));
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, listItem.upToDate, true, listItem.changesPageOpen);
      }));
      it('and changeVersion rejects', fakeAsync(function () {
        spyOn(service, 'changeVersion').and.returnValue(throwError(error));
        service.removeChanges().subscribe(() => fail('Observable should have rejected'), response => {
          expect(response).toEqual(error);
        });
        tick();
        expect(catalogManagerStub.deleteInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(service.changeVersion).toHaveBeenCalledWith(recordId, branchId, commitId, undefined, listItem.currentVersionTitle, listItem.upToDate, true, listItem.changesPageOpen);
      }));
    });
    it('when deleteInProgressCommit rejects', fakeAsync(function () {
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
  describe('uploadChanges should call the proper methods', function () {
    beforeEach(function () {
      spyOn(service, 'getListItemByRecordId').and.returnValue(listItem);
    });
    describe('when uploadChangesFile resolves', function () {
      beforeEach(function () {
        shapesGraphManagerStub.uploadChanges.and.returnValue(of(null));
      });
      it('and getInProgressCommit resolves', fakeAsync(function () {
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
      it('and getInProgressCommit rejects', fakeAsync(function () {
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
    it('when uploadChangesFile rejects', fakeAsync(function () {
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
  describe('changeVersion should call the proper methods when', function () {
    beforeEach(function () {
      this.oldListItem = cloneDeep(listItem);
      this.oldListItem.tabIndex = 1;
      this.oldListItem.inProgressCommit = difference;
      spyOn(service, 'getListItemByRecordId').and.returnValue(this.oldListItem);
    });
    describe('updateState resolves', function () {
      beforeEach(function () {
        spyOn(service, 'updateState').and.returnValue(of(null));
      });
      describe('and createListItem resolves', function () {
        beforeEach(function () {
          spyOn(service, 'createListItem').and.returnValue(of(listItem));
          spyOn(service, 'getActiveEntityIRI').and.returnValue('urn:testiri');
          spyOn(service, 'setSelected').and.returnValue(of(null));
        });
        it('and the in progress commit should be cleared with the same version title', fakeAsync(function () {
          const versionTitle = this.oldListItem.currentVersionTitle;
          service.changeVersion(recordId, branchId, commitId, tagId, undefined, listItem.upToDate, true, true)
            .subscribe(() => { }, () => fail('Observable should have resolved'));
          tick();
          expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, new Difference(), listItem.upToDate, listItem.versionedRdfRecord.title);
          expect(this.oldListItem.changesPageOpen).toBeTrue();
          expect(this.oldListItem.currentVersionTitle).toEqual(versionTitle);
        }));
        it('and the in progress commit should not be cleared with a new version title', fakeAsync(function () {
          service.changeVersion(recordId, branchId, commitId, tagId, 'New Title', listItem.upToDate, false, false)
            .subscribe(() => { }, () => fail('Observable should have resolved'));
          tick();
          expect(service.updateState).toHaveBeenCalledWith({ recordId, commitId, branchId, tagId });
          expect(service.createListItem).toHaveBeenCalledWith(recordId, branchId, commitId, tagId, difference, listItem.upToDate, listItem.versionedRdfRecord.title);
          expect(this.oldListItem.changesPageOpen).toBeFalse();
          expect(this.oldListItem.currentVersionTitle).toEqual('New Title');
        }));
      });
      it('and createListItem rejects', fakeAsync(function () {
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
    it('and updateState rejects', fakeAsync(function () {
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
  describe('should merge shapes graph branches', function () {
    beforeEach(function () {
      service.list = [listItem];
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
    describe('and should change the shapes graph version to the target branch', function () {
      describe('and handle if the checkbox is', function () {
        it('checked', function () {
          service.listItem.merge.checkbox = true;
          service.merge()
            .subscribe(() => {
              expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalogId', new Difference(), []);
              expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
              expect(catalogManagerStub.deleteRecordBranch).toHaveBeenCalledWith('recordId', 'sourceBranchId', catalogId);
            }, () => fail('Observable should have succeeded'));
        });
        it('unchecked', function () {
          service.listItem.merge.checkbox = false;
          service.merge()
            .subscribe(() => {
              expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith('sourceBranchId', 'targetBranchId', 'recordId', 'catalogId', new Difference(), []);
              expect(this.changeVersionSpy).toHaveBeenCalledWith('recordId', 'targetBranchId', 'commitId', undefined, 'branchTitle', true, false, false);
              expect(catalogManagerStub.deleteRecordBranch).not.toHaveBeenCalled();
            }, () => fail('Observable should have succeeded'));
        });
      });
      it('unless an error occurs', function () {
        this.changeVersionSpy.and.returnValue(throwError('Error'));
        service.merge()
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
    it('unless an error occurs', function () {
      catalogManagerStub.mergeBranches.and.returnValue(throwError('Error'));
      service.merge()
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
      { '@id': branchId, [`${DCTERMS}title`]: [{ '@value': 'Other Branch' }] },
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
      catalogManagerStub.getRecordBranches.and.returnValue(of(new HttpResponse<JSONLDObject[]>({ body: branches })));
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
  describe('should check if the node shape graph contains excluded predicates', function () {
    it('and return the number of excluded predicates if successful', function () {
      service.listItem = listItem;
      const sparqlResults: SPARQLSelectResults = {
        head: { vars: ['unsupportedNum'] },
        results: {
          bindings: [
            {
              unsupportedNum: {
                datatype: 'http://www.w3.org/2001/XMLSchema#integer',
                type: 'literal',
                value: '1'
              }
            }
          ]
        }
      };
      sparqlManagerStub.postQuery.and.returnValue(of(sparqlResults));
      service.checkForExcludedPredicates('http://stardog.com/tutorial/AlbumShape').subscribe(result => {
        expect(result).toEqual('1');
        expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), 'recordId', SHAPES_STORE_TYPE, 'branchId',
          'commitId', true, true, 'jsonld');
      });
    });
    it('and throw an error if unsuccessful', function () {
      service.listItem = listItem;
      const sparqlResults = 'invalid response type';
      sparqlManagerStub.postQuery.and.returnValue(of(sparqlResults));
      service.checkForExcludedPredicates('http://stardog.com/tutorial/AlbumShape')
        .subscribe(() => fail('Observable should not have resolved'), error => {
          expect(error).toEqual('Could not retrieve number of unsupported predicates.');
          expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(jasmine.any(String), 'recordId', SHAPES_STORE_TYPE,
            'branchId', 'commitId', true, true, 'jsonld');
        });
    });
  });
  describe('onIriEdit calls the appropriate manager methods', function () {
    const iriBegin = 'www.example.com/test-record';
    const iriThen = '/';
    const iriEnd = 'shapes-test';
    const newIRI = iriBegin + iriThen + iriEnd;
    const metadata: JSONLDObject = Object.freeze({
      '@id': 'www.example.com/test-record/shapes',
      '@type': [`${OWL}Ontology`],
    });
    beforeEach(function () {
      service.listItem = listItem;
      service.listItem.versionedRdfRecord.recordId = 'recordId';
      service.listItem.versionedRdfRecord.branchId = 'branchId';
      service.listItem.versionedRdfRecord.commitId = 'commitId';
      service.listItem.selected = metadata;
      service.list.push(service.listItem);
    });
    it('When there are already additions with the previous IRI', fakeAsync(function () {
      service.listItem.additions = [{
        '@id': 'www.example.com/test-record/shapes',
        '@type': [`${OWL}Ontology`],
        [`${DCTERMS}title`]: [{ '@value': 'UHTC Shapes Graph' }]
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
    it('When no usages are found', fakeAsync(function () {
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
    it('When retrieveUsages method throws an error', fakeAsync(function () {
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
    it('When retrieveUsages method resolves', fakeAsync(function () {
      const usages: JSONLDObject[] = [
        {
          '@id': '_:genid-f008989dbffa42c28d08087aacb415c738-464BF00DDBF1492E53EF0EBAD7F08536',
          [`${RDFS}isDefinedBy`]: [
            { '@id': 'www.example.com/test-record/shapes' }
          ],
        },
        {
          '@id': 'http://schema.org/ElementShape',
          [`${RDFS}isDefinedBy`]: [
            { '@id': 'www.example.com/test-record/shapes' }
          ],
        },
        {
          '@id': 'http://schema.org/MaterialShape',
          [`${RDFS}isDefinedBy`]: [
            { '@id': 'www.example.com/test-record/shapes' }
          ],
        },
      ];
      sparqlManagerStub.postQuery.and.returnValue(of(JSON.stringify(usages)));
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
  describe('updateNodeShapeSummaries', function () {
    let oldEntity: JSONLDObject;
    let newNodeShape: JSONLDObject;
    let otherNodeShapeSummary: NodeShapeSummary;
    beforeEach(function () {
      service.listItem = listItem;
      spyOn(service, 'updateEntityName');
      spyOn(service, 'getEntityName').and.callFake(iri => {
        if (iri === 'new:shape') {
          return 'A New Shape';
        }
        if (iri === 'new:targetClass') {
          return 'New Target Class';
        }
        return '';
      });
      otherNodeShapeSummary = {
        iri: 'other:shape',
        name: 'Other Shape',
        targetType: 'sh:targetClass',
        targetTypeLabel: 'sh:targetClass',
        targetValue: 'other:class',
        targetValueLabel: 'Other Class',
        imported: false,
        sourceOntologyIRI: 'sourceOntologyIRI'
      };
      oldEntity = {
        '@id': 'old:shape',
        [`${DCTERMS}Title`]: [{ '@value': 'Old Shape Name' }]
      };
      newNodeShape = {
        '@id': 'new:shape',
        [`${DCTERMS}Title`]: [{ '@value': 'A New Shape' }],
        [TARGET_CLASS]: [{ '@id': 'new:targetClass' }]
      };
      service.listItem.editorTabStates.nodeShapes.nodes = [
        otherNodeShapeSummary,
        {
          iri: 'old:shape',
          name: 'Z Old Shape',
          targetType: 'sh:targetNode',
          targetTypeLabel: 'sh:targetNode',
          targetValue: 'old:node',
          targetValueLabel: 'Old Node',
          imported: false,
          sourceOntologyIRI: 'sourceOntologyIRI'
        }
      ];
      service.shaclTargetDetector.detect = jasmine.createSpy().and.returnValue({
        targetType: 'sh:targetClass',
        value: 'new:targetClass',
        multiSelect: false
      });
    });
    it('should update the correct node shape summary with new IRI, name, and target info', function () {
      service.updateNodeShapeSummaries(oldEntity, newNodeShape);
      const updatedNodes = service.listItem.editorTabStates.nodeShapes.nodes;
      const updatedSummary = updatedNodes.find(n => n.iri === 'new:shape');
      expect(updatedSummary).toBeDefined();
      expect(updatedSummary.name).toEqual('A New Shape');
      expect(updatedSummary.targetType).toEqual('sh:targetClass');
      expect(updatedSummary.targetValue).toEqual('new:targetClass');
      expect(updatedSummary.targetValueLabel).toEqual('New Target Class');
    });
    it('should not modify other node shape summaries in the list', function () {
      service.updateNodeShapeSummaries(oldEntity, newNodeShape);
      const updatedNodes = service.listItem.editorTabStates.nodeShapes.nodes;
      const unchagedSummary = updatedNodes.find(n => n.iri === 'other:shape');
      expect(unchagedSummary).toEqual(otherNodeShapeSummary);
    });
    it('should re-sort the list of summaries by name after the update', function () {
      service.updateNodeShapeSummaries(oldEntity, newNodeShape);
      const updatedNodes = service.listItem.editorTabStates.nodeShapes.nodes;
      expect(updatedNodes[0].name).toEqual('A New Shape');
      expect(updatedNodes[1].name).toEqual('Other Shape');
    });
    it('should correctly handle a shape where the target is removed', function () {
      service.shaclTargetDetector.detect = jasmine.createSpy().and.returnValue(null);
      service.updateNodeShapeSummaries(oldEntity, newNodeShape);
      const updatedNodes = service.listItem.editorTabStates.nodeShapes.nodes;
      const updatedSummary = updatedNodes.find(n => n.iri === 'new:shape');
      expect(updatedSummary.targetType).toEqual('N/A');
      expect(updatedSummary.targetTypeLabel).toEqual('N/A');
      expect(updatedSummary.targetValue).toEqual('');
      expect(updatedSummary.targetValueLabel).toEqual('');
    });
    it('should call updateEntityName to keep the cache consistent', function () {
      service.updateNodeShapeSummaries(oldEntity, newNodeShape);
      expect(service.updateEntityName).toHaveBeenCalledWith(service.listItem.selected);
    });
  });
  describe('setSelected sets the selected entity', () => {
    const entityIri = 'urn:entity';
    const bnode1: JSONLDObject = { '@id': '_:b1', 'urn:prop': [{ '@value': 'bnode1-val' }] };
    const bnode2: JSONLDObject = { '@id': '_:b2', 'urn:prop': [{ '@value': 'bnode2-val' }] };
    const entityJsonld: JSONLDObject = { '@id': entityIri, 'urn:prop': [{ '@id': bnode1['@id'] }] };
    const blankNodeIndex: BlankNodeIndex = { 'node': { position: 2 } };
    let mockElementRef: ElementRef;
    beforeEach(() => {
      service.listItem = cloneDeep(listItem);
      service.listItem.selected = entityJsonld;
      service.listItem.subjectImportMap = {
        [entityIri]: { imported: false, alsoLocal: true },
        'urn:imported-entity': { imported: true, alsoLocal: false }
      };
      shapesGraphManagerStub.getShapesGraphEntity.and.returnValue(of([entityJsonld, bnode1, bnode2]));
      manchesterConverterStub.jsonldToManchester.and.callFake(id => `manchester for ${id}`);
      spyOn(service, 'getBnodeIndex').and.returnValue(blankNodeIndex);
      mockElementRef = { nativeElement: {} };
    });
    it('should do nothing and return null if listItem is not provided', fakeAsync(() => {
      service.setSelected(entityIri, null).subscribe(() => {
        fail('Observable should have failed, but it succeeded.');
      }, error => {
        expect(error).toEqual('Cannot set selected entity: The ShapesGraphListItem was not provided.');
      });
      tick();
      expect(shapesGraphManagerStub.getShapesGraphEntity).not.toHaveBeenCalled();
    }));
    it('should reset state and return null if entityIRI is not provided', fakeAsync(() => {
      service.listItem.selected = entityJsonld;
      service.setSelected(null).subscribe(result => {
        expect(result).toBeNull();
      });
      tick();
      expect(service.listItem.selected).toBeUndefined();
      expect(service.listItem.selectedBlankNodes).toEqual([]);
      expect(service.listItem.blankNodes).toEqual({});
      expect(shapesGraphManagerStub.getShapesGraphEntity).not.toHaveBeenCalled();
    }));
    it('should call spinner service when an element is provided', fakeAsync(() => {
      service.setSelected(entityIri, service.listItem, mockElementRef).subscribe();
      tick();
      expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(mockElementRef);
      expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(mockElementRef);
    }));
    describe('and fetches the entity', () => {
      it('as local if subjectImportMap marks it with alsoLocal: true', fakeAsync(() => {
        service.setSelected(entityIri).subscribe();
        tick();
        expect(shapesGraphManagerStub.getShapesGraphEntity).toHaveBeenCalledWith(
          recordId, branchId, commitId, entityIri, 'jsonld', true, false
        );
      }));
      it('as imported if subjectImportMap marks it with alsoLocal: false', fakeAsync(() => {
        service.setSelected('urn:imported-entity').subscribe();
        tick();
        expect(shapesGraphManagerStub.getShapesGraphEntity).toHaveBeenCalledWith(
          recordId, branchId, commitId, 'urn:imported-entity', 'jsonld', true, true
        );
      }));
      it('as imported if entity is not in subjectImportMap', fakeAsync(() => {
        service.setSelected('urn:unknown-entity').subscribe();
        tick();
        expect(shapesGraphManagerStub.getShapesGraphEntity).toHaveBeenCalledWith(
          recordId, branchId, commitId, 'urn:unknown-entity', 'jsonld', true, true
        );
      }));
    });
    it('should correctly populate listItem properties on success', fakeAsync(() => {
      service.setSelected(entityIri).subscribe(result => {
        expect(result).toBeNull();
      });
      tick();
      expect(service.listItem.selected).toEqual(entityJsonld);
      expect(service.listItem.selectedBlankNodes).toEqual([bnode1, bnode2]);
      expect(service.getBnodeIndex).toHaveBeenCalledWith([bnode1, bnode2]);
      expect(service.listItem.blankNodes['_:b1']).toEqual('manchester for _:b1');
      expect(service.listItem.blankNodes['_:b2']).toEqual('manchester for _:b2');
      expect(manchesterConverterStub.jsonldToManchester).toHaveBeenCalledTimes(2);
    }));
    it('should handle API errors and still finalize the spinner', fakeAsync(() => {
      shapesGraphManagerStub.getShapesGraphEntity.and.returnValue(throwError(error));
      service.setSelected(entityIri, service.listItem, mockElementRef).subscribe(
        () => fail('Observable should have failed'),
        err => expect(err).toEqual(error)
      );
      tick();
      expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(mockElementRef);
      expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(mockElementRef);
      expect(service.listItem.selected).toBeUndefined();
    }));
  });
  describe('getActiveKey', () => {
    beforeEach(() => {
      service.listItem = listItem;
    });
    it('should return project for PROJECT_TAB', () => {
      expect(service.getActiveKey(listItem, ShapesGraphListItem.PROJECT_TAB_IDX)).toBe('project');
    });
    it('should return nodeShapes for NODE_SHAPES_TAB', () => {
      expect(service.getActiveKey(listItem, ShapesGraphListItem.NODE_SHAPES_TAB_IDX)).toBe('nodeShapes');
    });
    it('should default to project', () => {
      expect(service.getActiveKey(listItem, 99)).toBe('project');
    });
    it('should use listItem tabIndex if no index is provided', () => {
      listItem.tabIndex = ShapesGraphListItem.NODE_SHAPES_TAB_IDX;
      expect(service.getActiveKey(listItem)).toBe('nodeShapes');
    });
  });
  describe('getActivePage', () => {
    beforeEach(() => {
      service.listItem = listItem;
    });
    it('should return the project page state', () => {
      listItem.tabIndex = ShapesGraphListItem.PROJECT_TAB_IDX;
      expect(service.getActivePage()).toBe(listItem.editorTabStates.project);
    });
    it('should return the node shapes page state', () => {
      listItem.tabIndex = ShapesGraphListItem.NODE_SHAPES_TAB_IDX;
      expect(service.getActivePage()).toBe(listItem.editorTabStates.nodeShapes);
    });
  });
  describe('getActiveEntityIRI', () => {
    beforeEach(() => {
      service.listItem = listItem;
    });
    it('should return the entityIRI from the active page', () => {
      listItem.tabIndex = ShapesGraphListItem.PROJECT_TAB_IDX;
      listItem.editorTabStates.project.entityIRI = 'urn:project-entity';
      expect(service.getActiveEntityIRI()).toBe('urn:project-entity');
      listItem.tabIndex = ShapesGraphListItem.NODE_SHAPES_TAB_IDX;
      listItem.setSelectedNodeShapeIri('urn:nodeshape-entity');
      expect(service.getActiveEntityIRI()).toBe('urn:nodeshape-entity');
    });
  });
  describe('getPropValueDisplay gets the correct value for a property', function () {
    beforeEach(function () {
      service.listItem = listItem;
      service.listItem.selected = {
        '@id': 'urn:test',
        'urn:valueProp': [{ '@value': 'Data Value' }],
        'urn:idProp': [{ '@id': 'urn:iri' }]
      };
    });
    it('for a value property', function () {
      const display = service.getPropValueDisplay('urn:valueProp', 0);
      expect(display).toEqual('Data Value');
    });
    it('for an id property', function () {
      const display = service.getPropValueDisplay('urn:idProp', 0);
      expect(display).toEqual('urn:iri');
    });
    it('and returns undefined if not found', function () {
      const display = service.getPropValueDisplay('urn:nonExistentProp', 0);
      expect(display).toBeUndefined();
    });
  });
  describe('removeProperty removes a property value', function () {
    const propertyKey = 'urn:prop';
    const valueToRemove = { '@value': 'Value 1' };
    const otherValue = { '@value': 'Value 2' };
    beforeEach(function () {
      service.listItem = listItem;
      service.listItem.selected = {
        '@id': 'urn:entity',
        [propertyKey]: [valueToRemove, otherValue]
      };
      spyOn(service, 'addToDeletions');
    });
    it('successfully', fakeAsync(function () {
      spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
      service.removeProperty(propertyKey, 0).subscribe(removed => {
        expect(removed).toEqual(valueToRemove);
      }, () => fail('Observable should have succeeded'));
      tick();

      expect(service.addToDeletions).toHaveBeenCalledWith(recordId, {
        '@id': 'urn:entity',
        [propertyKey]: [valueToRemove]
      });
      expect(propertyManagerStub.remove).toHaveBeenCalledWith(service.listItem.selected, propertyKey, 0);
      expect(service.saveCurrentChanges).toHaveBeenCalledWith();
    }));
    it('unless saving changes fails', fakeAsync(function () {
      spyOn(service, 'saveCurrentChanges').and.returnValue(throwError(error));
      service.removeProperty(propertyKey, 0).subscribe(() => fail('Observable should have failed'), err => {
        expect(err).toEqual(error);
      });

      expect(service.addToDeletions).toHaveBeenCalled();
      expect(propertyManagerStub.remove).toHaveBeenCalled();
      expect(service.saveCurrentChanges).toHaveBeenCalledWith();
    }));
  });
  it('openSnackbar should open a snackbar for the provided entity IRI', () => {
    spyOn(service, 'goTo');
    spyOn(service, 'getEntityName').and.returnValue('Name');
    service.listItem = new ShapesGraphListItem();
    service.openSnackbar('iri');
    expect(snackBarStub.open).toHaveBeenCalledWith('Name successfully created', 'Open', { duration: 5500 });
    expect(onActionSpy).toHaveBeenCalledWith();
    expect(afterDismissedSpy).toHaveBeenCalledWith();
    expect(service.goTo).toHaveBeenCalledWith('iri');
    expect(service.listItem.openSnackbar).toBeUndefined();
  });
  it('closeSnackbar should dismiss snackbar for the provided entity IRI', () => {
    service.listItem = new ShapesGraphListItem();
    service.listItem.openSnackbar = jasmine.createSpyObj('MatSnackBarRef', ['dismiss']);
    service.closeSnackbar();
    expect(service.listItem.openSnackbar.dismiss).toHaveBeenCalledWith();
  });
  describe('isSelectedImported checks if the selected entity is imported', function () {
    beforeEach(function () {
      service.listItem = listItem;
      service.listItem.subjectImportMap = {
        'urn:importedOnly': { imported: true, alsoLocal: false, ontologyIds: ['a'] },
        'urn:importedAndLocal': { imported: true, alsoLocal: true, ontologyIds: ['a'] },
        'urn:localOnly': { imported: false, alsoLocal: true, ontologyIds: [] }
      };
    });
    it('and returns true if only imported', function () {
      service.listItem.selected = { '@id': 'urn:importedOnly' };
      expect(service.isSelectedImported()).toBeTrue();
    });
    it('and returns false if imported but also local', function () {
      service.listItem.selected = { '@id': 'urn:importedAndLocal' };
      expect(service.isSelectedImported()).toBeFalse();
    });
    it('and returns false if only local', function () {
      service.listItem.selected = { '@id': 'urn:localOnly' };
      expect(service.isSelectedImported()).toBeFalse();
    });
    it('and returns true if entity not in map (default)', function () {
      service.listItem.selected = { '@id': 'urn:notInMap' };
      expect(service.isSelectedImported()).toBeTrue();
    });
    it('and returns true if no entity is selected', function () {
      service.listItem.selected = undefined;
      expect(service.isSelectedImported()).toBeTrue();
    });
  });
  describe('isImported checks if a given IRI is imported', function () {
    beforeEach(function () {
      service.listItem = listItem;
      service.listItem.subjectImportMap = {
        'urn:importedOnly': { imported: true, alsoLocal: false, ontologyIds: ['a'] },
        'urn:importedAndLocal': { imported: true, alsoLocal: true, ontologyIds: ['a'] },
        'urn:localOnly': { imported: false, alsoLocal: true, ontologyIds: [] }
      };
    });
    it('and returns true if only imported', function () {
      expect(service.isImported('urn:importedOnly')).toBeTrue();
    });
    it('and returns false if imported but also local', function () {
      expect(service.isImported('urn:importedAndLocal')).toBeFalse();
    });
    it('and returns false if only local', function () {
      expect(service.isImported('urn:localOnly')).toBeFalse();
    });
    it('and returns true if IRI not in map (default)', function () {
      expect(service.isImported('urn:notInMap')).toBeTrue();
    });
    it('and returns true if listItem is missing', function () {
      expect(service.isImported('urn:anything', null)).toBeTrue();
    });
  });
  describe('checkIri checks if an IRI exists and is not the current entity', function () {
    beforeEach(function () {
      service.listItem = listItem;
      service.listItem.selected = { '@id': 'urn:current' };
      service.listItem.subjectImportMap = {
        'urn:current': { imported: false, alsoLocal: true, ontologyIds: [] },
        'urn:exists': { imported: false, alsoLocal: true, ontologyIds: [] }
      };
    });
    it('and returns false for the current IRI', function () {
      expect(service.checkIri('urn:current')).toBeFalse();
    });
    it('and returns true for an existing, different IRI', function () {
      expect(service.checkIri('urn:exists')).toBeTrue();
    });
    it('and returns false for a non-existent IRI', function () {
      expect(service.checkIri('urn:doesNotExist')).toBeFalse();
    });
  });
  describe('getImportedSource gets the source IRI for an import', function () {
    beforeEach(function () {
      service.listItem = listItem;
    });
    it('and returns the source IRI if it exists', function () {
      service.listItem.editorTabStates.nodeShapes.sourceIRI = 'urn:source-shape';
      expect(service.getImportedSource()).toEqual('urn:source-shape');
    });
    it('and returns an empty string if it does not exist', function () {
      service.listItem.editorTabStates.nodeShapes.sourceIRI = undefined;
      expect(service.getImportedSource()).toEqual('');
    });
    it('and returns an empty string if the listItem is null', function () {
      service.listItem = null;
      expect(service.getImportedSource()).toEqual('');
    });
  });
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
  describe('getClassOptions', () => {
    const query = 'SELECT * WHERE { ?s ?p ?o . }';
    const iris = ['class1', 'class2'];
    beforeEach(() => {
      spyOn(service, 'getClassesQuery').and.returnValue(query);
      spyOn(service as any, '_fetchIris').and.returnValue(of(iris));
      spyOn(service, 'groupSuggestionsByOntologyIri').and.returnValue([{ label: 'group', suggestions: [] }] as GroupedSuggestion[]);
    });
    it('should fetch and group class options with no arguments', fakeAsync(() => {
      service.getClassOptions().subscribe();
      tick();
      expect(service.getClassesQuery).toHaveBeenCalledWith('');
      expect(service['_fetchIris']).toHaveBeenCalledWith(query, false);
      expect(service.groupSuggestionsByOntologyIri).toHaveBeenCalledWith(iris);
    }));
    it('should fetch and group class options with search text and tracked elsewhere', fakeAsync(() => {
      service.getClassOptions('test', true).subscribe();
      tick();
      expect(service.getClassesQuery).toHaveBeenCalledWith('test');
      expect(service['_fetchIris']).toHaveBeenCalledWith(query, true);
      expect(service.groupSuggestionsByOntologyIri).toHaveBeenCalledWith(iris);
    }));
  });
  describe('getClassesQuery', () => {
    it('should return correct query without filter', () => {
      const query = service.getClassesQuery();
      expect(query).toContain('PREFIX owl: <http://www.w3.org/2002/07/owl#>');
      expect(query).toContain('SELECT DISTINCT ?iri WHERE');
      expect(query).toContain('?iri a owl:Class .');
      expect(query).not.toContain('FILTER(CONTAINS');
    });
    it('should include filter for searchText', () => {
      const query = service.getClassesQuery('TestClass');
      expect(query).toContain('FILTER(CONTAINS(LCASE(STR(?iri)), "testclass")');
    });
  });
  describe('getPropertyOptions', () => {
    const query = 'SELECT * WHERE { ?s ?p ?o . }';
    const iris: { iri: string, type: string}[] = [
      { iri: 'class1', type: `${OWL}ObjectProperty` },
      { iri: 'class2', type: `${OWL}DatatypeProperty` }
    ];
    beforeEach(() => {
      spyOn(service, 'getPropertiesByTypeQuery').and.returnValue(query);
      spyOn(service as any, '_fetchIrisWithTypes').and.returnValue(of(iris));
      spyOn(service, 'groupSuggestionsWithTypeByOntologyIri').and.returnValue([{ label: 'group', suggestions: [] }] as GroupedSuggestion[]);
    });
    it('should fetch and group class options with no arguments', fakeAsync(() => {
      service.getPropertyOptions().subscribe();
      tick();
      expect(service.getPropertiesByTypeQuery).toHaveBeenCalledWith('', []);
      expect(service['_fetchIrisWithTypes']).toHaveBeenCalledWith(query, false);
      expect(service.groupSuggestionsWithTypeByOntologyIri).toHaveBeenCalledWith(iris);
    }));
    it('should fetch and group class options with search text and tracked elsewhere', fakeAsync(() => {
      service.getPropertyOptions('test', ['ObjectProperty', 'DatatypeProperty'], true).subscribe();
      tick();
      expect(service.getPropertiesByTypeQuery).toHaveBeenCalledWith('test', ['ObjectProperty', 'DatatypeProperty']);
      expect(service['_fetchIrisWithTypes']).toHaveBeenCalledWith(query, true);
      expect(service.groupSuggestionsWithTypeByOntologyIri).toHaveBeenCalledWith(iris);
    }));
  });
  describe('getPropertiesByTypeQuery', () => {
    it('should return correct query without searchText or types', () => {
      const query = service.getPropertiesByTypeQuery();
      expect(query).toContain('VALUES ?type { owl:ObjectProperty owl:DatatypeProperty owl:AnnotationProperty }');
      expect(query).toContain('SELECT DISTINCT ?iri ?type WHERE');
      expect(query).not.toContain('FILTER(CONTAINS');
    });
    it('should include filter for searchText', () => {
      const query = service.getPropertiesByTypeQuery('Prop');
      expect(query).toContain('VALUES ?type { owl:ObjectProperty owl:DatatypeProperty owl:AnnotationProperty }');
      expect(query).toContain('SELECT DISTINCT ?iri ?type WHERE');
      expect(query).toContain('FILTER(CONTAINS(LCASE(STR(?iri)), "prop")');
    });
    it('should include filter for types', () => {
      const query = service.getPropertiesByTypeQuery('', ['AnnotationProperty', 'DatatypeProperty']);
      expect(query).toContain('VALUES ?type { owl:AnnotationProperty owl:DatatypeProperty }');
      expect(query).toContain('SELECT DISTINCT ?iri ?type WHERE');
      expect(query).not.toContain('FILTER(CONTAINS');
    });
  });
  it('groupSuggestionsByOntologyIri should create grouped suggestions based off a list of iris', () => {
    spyOn(service, 'getEntityName').and.callFake(iri => `entityName(${iri})`);
    const iris = ['http://test.com#class2', 'http://test.com#class1', 'http://example.com#class3'];
    const grouped = service.groupSuggestionsByOntologyIri(iris);
    expect(grouped).toEqual([
      { label: 'http://example.com', suggestions: [
        { label: 'entityName(http://example.com#class3)', value: 'http://example.com#class3' },
      ] },
      { label: 'http://test.com', suggestions: [
        { label: 'entityName(http://test.com#class1)', value: 'http://test.com#class1' },
        { label: 'entityName(http://test.com#class2)', value: 'http://test.com#class2' },
      ] },
    ]);
  });
  it('groupSuggestionsWithTypeByOntologyIri should create grouped suggestions based off a list of iris', () => {
    spyOn(service, 'getEntityName').and.callFake(iri => `entityName(${iri})`);
    const iris = [
      { iri: 'http://test.com#class2', type: `${OWL}AnnotationProperty` },
      { iri: 'http://test.com#class1', type: `${OWL}DatatypeProperty` },
      { iri: 'http://example.com#class3', type: `${OWL}ObjectProperty` }
    ];
    const grouped = service.groupSuggestionsWithTypeByOntologyIri(iris);
    expect(grouped).toEqual([
      { label: 'http://example.com', suggestions: [
        { label: 'entityName(http://example.com#class3)', value: 'http://example.com#class3', type: `${OWL}ObjectProperty` },
      ] },
      { label: 'http://test.com', suggestions: [
        { label: 'entityName(http://test.com#class1)', value: 'http://test.com#class1', type: `${OWL}DatatypeProperty` },
        { label: 'entityName(http://test.com#class2)', value: 'http://test.com#class2', type: `${OWL}AnnotationProperty` },
      ] },
    ]);
  });
  describe('_fetchIris', () => {
    beforeEach(() => {
      service.listItem = listItem;
    });
    it('should return empty array if listItem has no versionedRdfRecord', fakeAsync(() => {
      service.listItem.versionedRdfRecord = null;
      (service['_fetchIris']('query') as Observable<string[]>).subscribe(result => {
        expect(result).toEqual([]);
      });
      tick();
    }));
    it('should post a query and map the results to an array of IRIs', fakeAsync(() => {
      const mockResponse: SPARQLSelectResults = {
        head: {
          vars: ['iri', 'B']
        },
        results: {
          bindings: [
            { iri: { value: 'iri1', type: `${XSD}string` } },
            { iri: { value: 'iri2', type: `${XSD}string` } }
          ]
        }
      };
      sparqlManagerStub.postQuery.and.returnValue(of(mockResponse));
      (service['_fetchIris']('query') as Observable<string[]>).subscribe(result => {
        expect(result).toEqual(['iri1', 'iri2']);
      });
      tick();
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(
        'query', recordId, SHAPES_STORE_TYPE, branchId, commitId, true, true, 'application/json', false
      );
    }));
    it('should handle empty response from postQuery', fakeAsync(() => {
      sparqlManagerStub.postQuery.and.returnValue(of(null));
      (service['_fetchIris']('query') as Observable<string[]>).subscribe(result => {
        expect(result).toEqual([]);
      });
      tick();
    }));
  });
  describe('_fetchIrisWithTypes', () => {
    beforeEach(() => {
      service.listItem = listItem;
    });
    it('should return empty array if listItem has no versionedRdfRecord', fakeAsync(() => {
      service.listItem.versionedRdfRecord = null;
      (service['_fetchIrisWithTypes']('query') as Observable<{ iri: string, type: string }[]>).subscribe(result => {
        expect(result).toEqual([]);
      });
      tick();
    }));
    it('should post a query and map the results to an array of IRIs', fakeAsync(() => {
      const mockResponse: SPARQLSelectResults = {
        head: {
          vars: ['iri', 'type']
        },
        results: {
          bindings: [
            { iri: { value: 'iri1', type: `${XSD}string` }, type: { value: `${OWL}DatatypeProperty`, type: `${XSD}string` } },
            { iri: { value: 'iri2', type: `${XSD}string` }, type: { value: `${OWL}ObjectProperty`, type: `${XSD}string` } }
          ]
        }
      };
      sparqlManagerStub.postQuery.and.returnValue(of(mockResponse));
      (service['_fetchIrisWithTypes']('query') as Observable<{ iri: string, type: string }[]>).subscribe(result => {
        expect(result).toEqual([
          { iri: 'iri1', type: `${OWL}DatatypeProperty` },
          { iri: 'iri2', type: `${OWL}ObjectProperty` },
        ]);
      });
      tick();
      expect(sparqlManagerStub.postQuery).toHaveBeenCalledWith(
        'query', recordId, SHAPES_STORE_TYPE, branchId, commitId, true, true, 'application/json', false
      );
    }));
    it('should handle empty response from postQuery', fakeAsync(() => {
      sparqlManagerStub.postQuery.and.returnValue(of(null));
      (service['_fetchIrisWithTypes']('query') as Observable<{ iri: string, type: string }[]>).subscribe(result => {
        expect(result).toEqual([]);
      });
      tick();
    }));
  });
  describe('should remove the provided node shape', () => {
    const nodeShape: JSONLDObject = { '@id': 'urn:nodeShape' };
    beforeEach(() => {
      service.listItem = listItem;
      service.listItem.selected = nodeShape;
      service.listItem.entityInfo[nodeShape['@id']] = { label: 'Label', names: [] };
      service.listItem.selectedBlankNodes = [
        { '@id': '_:b2' },
        { '@id': '_:b3' },
        { '@id': '_:b4' },
      ];
      spyOn(service, 'addToDeletions');
      spyOn(service, 'removeEntity');
      spyOn(service, 'setSelected').and.returnValue(of(null));
    });
    describe('if there are no property shapes', () => {
      it('successfully', fakeAsync(() => {
        spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
        service.removeNodeShape(nodeShape, []).subscribe(() => {
          expect(true).toBeTrue();
        }), () => fail('Observable should have succeeded');
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, nodeShape);
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.removeEntity).toHaveBeenCalledWith(nodeShape['@id'], service.listItem);
        expect(service.setSelected).toHaveBeenCalledWith(undefined, service.listItem);
      }));
      it('unless an error occurs', fakeAsync(() => {
        spyOn(service, 'saveCurrentChanges').and.returnValue(throwError(error));
        service.removeNodeShape(nodeShape, []).subscribe(() => fail('Observable should have failed'), result => {
          expect(result).toEqual(error);
        });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, nodeShape);
        expect(service.saveCurrentChanges).toHaveBeenCalledWith();
        expect(service.removeEntity).not.toHaveBeenCalled();
        expect(service.setSelected).not.toHaveBeenCalled();
      }));
    });
    describe('if there are property shapes', () => {
      const referencedNodeIds = new Set(['_:b2', '_:b3']);
      const propertyShape: PropertyShape = {
        id: 'urn:PropShape',
        label: 'Prop Shape',
        jsonld: {
          '@id': 'urn:PropShape',
          [`${SH}path`]: [{ '@id': '_:b2' }]
        },
        constraints: [],
        path: undefined,
        pathString: '',
        pathHtmlString: '',
        referencedNodeIds
      };
      beforeEach(() => {
        spyOn(service, 'saveCurrentChanges').and.returnValue(of(null));
      });
      it('successfully', fakeAsync(() => {
        const usages = [{ '@id': 'urn:somethingElse', 'urn:someProp': [{ '@id': propertyShape.id }] }];
        sparqlManagerStub.postQuery.and.returnValue(of(JSON.stringify(usages)));
        service.removeNodeShape(nodeShape, [propertyShape]).subscribe(() => {
          expect(true).toBeTrue();
        }), () => fail('Observable should have succeeded');
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, nodeShape);
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
        expect(service.removeEntity).toHaveBeenCalledWith(nodeShape['@id'], service.listItem);
        expect(service.setSelected).toHaveBeenCalledWith(undefined, service.listItem);
      }));
      it('unless an error occurs', fakeAsync(() => {
        sparqlManagerStub.postQuery.and.returnValue(throwError(error));
        service.removeNodeShape(nodeShape, [propertyShape]).subscribe(() => fail('Observable should have failed'), result => {
          expect(result).toEqual(error);
        });
        tick();
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, nodeShape);
        expect(service.addToDeletions).toHaveBeenCalledWith(recordId, propertyShape.jsonld);
        [{ '@id': '_:b2' }, { '@id': '_:b3' }].forEach(bnode => {
          expect(service.addToDeletions).toHaveBeenCalledWith(recordId, bnode);
        });
        expect(service.saveCurrentChanges).not.toHaveBeenCalled();
        expect(service.removeEntity).not.toHaveBeenCalled();
        expect(service.setSelected).not.toHaveBeenCalled();
      }));
    });
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
        const usages = [{ '@id': 'urn:somethingElse', 'urn:someProp': [{ '@id': propertyShape.id }] }];
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
          sparqlManagerStub.postQuery.and.returnValue(of({ head: { vars: [] }, results: { bindings: [] } }));
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
