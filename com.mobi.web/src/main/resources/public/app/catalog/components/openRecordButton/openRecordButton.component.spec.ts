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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
  cleanStylesFromDOM, MockVersionedRdfState,
} from '../../../../test/ts/Shared';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { CATALOG, DATASET, DCTERMS, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { MapperStateService } from '../../../shared/services/mapperState.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { ToastService } from '../../../shared/services/toast.service';
import { OntologyListItem } from '../../../shared/models/ontologyListItem.class';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RecordSelectFiltered } from '../../../versioned-rdf-record-editor/models/record-select-filtered.interface';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { WorkflowsStateService } from '../../../workflows/services/workflows-state.service';
import { WorkflowSchema } from '../../../workflows/models/workflow-record.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { EntityNamesItem } from '../../../shared/models/entityNamesItem.interface';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { Difference } from '../../../shared/models/difference.class';
import { OpenRecordButtonComponent } from './openRecordButton.component';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';

describe('Open Record Button component', function () {
  let component: OpenRecordButtonComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<OpenRecordButtonComponent<VersionedRdfListItem>>;
  let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
  let mapperStateStub: jasmine.SpyObj<MapperStateService>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let router: Router;

  const recordId = 'recordId';
  const catalogId = 'http://mobi.com/catalog-local';
  const error = 'Error message';
  const record: JSONLDObject = {
    '@id': recordId,
    '@type': [`${CATALOG}Record`],
    [`${DCTERMS}title`]: [{ '@value': 'title' }]
  };
  const entityRecord: JSONLDObject = {
    '@id': recordId,
    '@type': [`${CATALOG}Record`],
    entityIRI: 'id',
    [`${CATALOG}masterBranch`]: [{'@id': 'masterBranch'}],
    [`${DCTERMS}title`]: [{'@value': 'title'}]
  };

  const entityInfo: EntityNamesItem = {
    label: 'label',
    names: ['name'],
    imported: false,
    ontologyId: 'id'
  };
  const branch: JSONLDObject = {
    '@id': 'branchId',
    '@type': [`${CATALOG}Branch`],
    [`${CATALOG}head`]: [{'@id': 'commitId'}]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ SharedModule, RouterTestingModule.withRoutes([]) ],
      declarations: [
        OpenRecordButtonComponent,
      ],
      providers: [
        MockProvider(CatalogStateService),
        MockProvider(CatalogManagerService),
        MockProvider(ShapesGraphStateService),
        MockProvider(DatasetStateService),
        MockProvider(MapperStateService),
        MockProvider(OntologyStateService),
        MockProvider(WorkflowsStateService),
        MockProvider(PolicyEnforcementService),
        MockProvider(PolicyManagerService),
        MockProvider(ToastService),
        { provide: stateServiceToken, useClass: MockVersionedRdfState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenRecordButtonComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {
      '@id': catalogId,
      '@type': [`${CATALOG}Catalog`]
    };
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
    datasetStateStub = TestBed.inject(DatasetStateService) as jasmine.SpyObj<DatasetStateService>;
    mapperStateStub = TestBed.inject(MapperStateService) as jasmine.SpyObj<MapperStateService>;
    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    policyManagerStub = TestBed.inject(PolicyManagerService) as jasmine.SpyObj<PolicyManagerService>;
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    spyOn(router, 'navigate');

    ontologyStateStub.getEntityByRecordId.and.returnValue(entityInfo);
    ontologyStateStub.changeVersion.and.returnValue(of(null));
    shapesGraphStateStub.changeVersion.and.returnValue(of(null));
    catalogManagerStub.getRecord.and.returnValue(of([entityRecord]));
    catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
    policyEnforcementStub.permit = 'Permit';
    policyEnforcementStub.deny = 'Deny';
    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
    component.state.listItem = new VersionedRdfListItem();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    catalogStateStub = null;
    datasetStateStub = null;
    mapperStateStub = null;
    catalogManagerStub = null;
    ontologyStateStub = null;
    workflowsStateStub = null;
    policyEnforcementStub = null;
    toastStub = null;
    router = null;
  });

  it('should initialize correctly on record change', function() {
    spyOn(component, 'handleRecordUpdate');
    component.record = record;
    expect(component.handleRecordUpdate).toHaveBeenCalledWith();
  });
  describe('controller methods', function() {
    describe('openRecord calls the correct method', function() {
      beforeEach(function() {
        component.stopProp = true;
        this.event = new MouseEvent('click');
        spyOn(this.event, 'stopPropagation');
        spyOn(component, 'updateEntityRecord');
        spyOn(component, 'navigateToRecord');
        component.record = record;
      });
      it('unless the user cannot read the record', fakeAsync(function() {
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
        component.openRecord(this.event);
        tick();
        expect(this.event.stopPropagation).toHaveBeenCalledWith();
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: record['@id'],
          actionId: policyManagerStub.actionRead
        });
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(component.updateEntityRecord).not.toHaveBeenCalled();
        expect(component.navigateToRecord).not.toHaveBeenCalled();
      }));
      describe('if the user can read the record', function() {
        it('and the component is on the Catalog page', fakeAsync(function() {
          component.isEntityRecord = false;
          component.openRecord(this.event);
          tick();
          expect(this.event.stopPropagation).toHaveBeenCalledWith();
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
            resourceId: record['@id'],
            actionId: policyManagerStub.actionRead
          });
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(component.updateEntityRecord).not.toHaveBeenCalled();
          expect(component.navigateToRecord).toHaveBeenCalledWith();
        }));
        it('and the component is on the Entity Search page', fakeAsync(function() {
          component.isEntityRecord = true;
          component.openRecord(this.event);
          tick();
          expect(this.event.stopPropagation).toHaveBeenCalledWith();
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
            resourceId: record['@id'],
            actionId: policyManagerStub.actionRead
          });
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(component.updateEntityRecord).toHaveBeenCalledWith();
          expect(component.navigateToRecord).not.toHaveBeenCalled();
        }));
      });
    });
    describe('navigateToRecord calls the correct method when record is a', function() {
      it('OntologyRecord', function() {
        component.recordType = `${ONTOLOGYEDITOR}OntologyRecord`;
        spyOn(component, 'openOntology');
        component.navigateToRecord();
        expect(component.openOntology).toHaveBeenCalledWith();
      });
      it('MappingRecord', function() {
        component.recordType = `${DELIM}MappingRecord`;
        spyOn(component, 'openMapping');
        component.navigateToRecord();
        expect(component.openMapping).toHaveBeenCalledWith();
      });
      it('DatasetRecord', function() {
        component.recordType = `${DATASET}DatasetRecord`;
        spyOn(component, 'openDataset');
        component.navigateToRecord();
        expect(component.openDataset).toHaveBeenCalledWith();
      });
      it('ShapesGraphRecord', function() {
        component.recordType = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;
        spyOn(component, 'openShapesGraph');
        component.navigateToRecord();
        expect(component.openShapesGraph).toHaveBeenCalledWith();
      });
      it('WorkflowRecord', function() {
        component.recordType = `${WORKFLOWS}WorkflowRecord`;
        spyOn(component, 'openWorkflow');
        component.navigateToRecord();
        expect(component.openWorkflow).toHaveBeenCalledWith();
      });
      it('an unknown type', function () {
        component.recordType = 'unknown';
        component.navigateToRecord();
        expect(toastStub.createWarningToast).toHaveBeenCalledWith(jasmine.stringContaining('No module'));
      });
    });
    describe('openOntology navigates to the ontology editor', function() {
      describe('if the component is in the Catalog page', function() {
        beforeEach(function() {
          component.record = record;
        });
        it('if it is already open', function() {
          const listItem = new OntologyListItem();
          listItem.versionedRdfRecord.recordId = record['@id'];
          ontologyStateStub.list = [listItem];
          component.openOntology();
          expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
          expect(ontologyStateStub.open).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(ontologyStateStub.listItem).toEqual(listItem);
        });
        describe('if it is not open already', function() {
          const recordSelect: RecordSelectFiltered = {
            recordId: 'recordId',
            title: 'title',
            description: '',
            identifierIRI: 'ontologyId'
          };
          beforeEach(function() {
            ontologyStateStub.getIdentifierIRI.and.returnValue('ontologyId');
          });
          it('successfully', fakeAsync(function() {
            ontologyStateStub.open.and.returnValue(of(null));
            component.openOntology();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
            expect(ontologyStateStub.open).toHaveBeenCalledWith(recordSelect);
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          }));
          it('unless an error occurs', fakeAsync(function() {
            ontologyStateStub.open.and.returnValue(throwError('error'));
            component.openOntology();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
            expect(ontologyStateStub.open).toHaveBeenCalledWith(recordSelect);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
          }));
        });
      });
      describe('if the component is in the Entity Search page', function() {
        beforeEach(function () {
          component.record = entityRecord;
        });
        it('if it is already open', function () {
          const listItem = new OntologyListItem();
          component.isEntityRecord = true;
          component.hasCommitInProgress = false;
          listItem.currentVersionTitle = 'Master';
          listItem.versionedRdfRecord.recordId = entityRecord['@id'];
          listItem.versionedRdfRecord.branchId = 'masterBranch';
          ontologyStateStub.list = [listItem];
          component.openOntology();
          expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
          expect(ontologyStateStub.open).not.toHaveBeenCalled();
          expect(ontologyStateStub.changeVersion).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(ontologyStateStub.listItem).toEqual(listItem);
        });
        it('if it is already open and master branch is not selected', function () {
          const listItem = new OntologyListItem();
          component.isEntityRecord = true;
          component.hasCommitInProgress = false;
          listItem.currentVersionTitle = 'test';
          listItem.versionedRdfRecord.recordId = record['@id'];
          listItem.versionedRdfRecord.branchId = '';
          component.recordType = `${ONTOLOGYEDITOR}OntologyRecord`;
          ontologyStateStub.list = [listItem];
          component.openOntology();
          expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
          expect(ontologyStateStub.open).not.toHaveBeenCalled();
          expect(ontologyStateStub.changeVersion).toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(toastStub.createWarningToast).toHaveBeenCalled();
          expect(ontologyStateStub.listItem).toEqual(listItem);
        });
        describe('if it is not open already', function () {
          const recordSelect: RecordSelectFiltered = {
            recordId: 'recordId',
            title: 'title',
            description: '',
            identifierIRI: 'ontologyId'
          };
          beforeEach(function () {
            ontologyStateStub.getIdentifierIRI.and.returnValue('ontologyId');
          });
          it('successfully', fakeAsync(function () {
            component.isEntityRecord = true;
            component.hasCommitInProgress = true;
            ontologyStateStub.open.and.returnValue(of(null));
            component.openOntology();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/ontology-editor']);
            expect(ontologyStateStub.open).toHaveBeenCalledWith(recordSelect);
            expect(toastStub.createWarningToast).toHaveBeenCalled();
          }));
        });
      });
    });
    it('openMapping should navigate to the mapping module and select the mapping', function() {
      component.record = record;
      mapperStateStub.paginationConfig = {
        searchText: ''
      };
      component.openMapping();
      expect(mapperStateStub.paginationConfig.searchText).toEqual('title');
      expect(router.navigate).toHaveBeenCalledWith(['/mapper']);
    });
    it('openDataset navigates to the dataset module', function() {
      component.record = record;
      datasetStateStub.paginationConfig = {
        searchText: ''
      };
      component.openDataset();
      expect(datasetStateStub.paginationConfig.searchText).toEqual('title');
      expect(router.navigate).toHaveBeenCalledWith(['/datasets']);
    });
    describe('openShapesGraphRecord navigates to the shapes editor', function() {
      describe('if the component is in the Catalog page', function() {
        beforeEach(function() {
          component.record = record;
        });
        it('if it is already open', function() {
          const listItem = new ShapesGraphListItem();
          listItem.versionedRdfRecord.recordId = record['@id'];
          shapesGraphStateStub.list = [listItem];
          component.openShapesGraph();
          expect(router.navigate).toHaveBeenCalledWith(['/shapes-graph-editor']);
          expect(shapesGraphStateStub.open).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(shapesGraphStateStub.listItem).toEqual(listItem);
        });
        describe('if it is not open already', function() {
          const recordSelect: RecordSelectFiltered = {
            recordId: 'recordId',
            title: 'title',
            description: '',
            identifierIRI: 'shapesGraphId'
          };
          beforeEach(function() {
            shapesGraphStateStub.getIdentifierIRI.and.returnValue('shapesGraphId');
          });
          it('successfully', fakeAsync(function() {
            shapesGraphStateStub.open.and.returnValue(of(null));
            component.openShapesGraph();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/shapes-graph-editor']);
            expect(shapesGraphStateStub.open).toHaveBeenCalledWith(recordSelect);
            expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          }));
          it('unless an error occurs', fakeAsync(function() {
            shapesGraphStateStub.open.and.returnValue(throwError('error'));
            component.openShapesGraph();
            tick();
            expect(router.navigate).toHaveBeenCalledWith(['/shapes-graph-editor']);
            expect(shapesGraphStateStub.open).toHaveBeenCalledWith(recordSelect);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
          }));
        });
      });
      describe('if the component is in the Entity Search page', function() {
        beforeEach(function () {
          component.recordType = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;
          component.record = entityRecord;
        });
        it('if it is already open', function () {
          const listItem: ShapesGraphListItem = new ShapesGraphListItem();
          listItem.versionedRdfRecord.recordId = entityRecord['@id'];
          component.isEntityRecord = true;
          component.hasCommitInProgress = false;
          listItem.currentVersionTitle = 'Master';
  
          listItem.versionedRdfRecord.branchId = 'masterBranch';
          shapesGraphStateStub.list = [listItem];
          fixture.detectChanges();
          component.openShapesGraph();
          expect(router.navigate).toHaveBeenCalledWith(['/shapes-graph-editor']);
          expect(shapesGraphStateStub.open).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(shapesGraphStateStub.listItem).toEqual(listItem);
        });
        it('if it is already open and master branch is not selected',   () => {
          const listItem: ShapesGraphListItem = new ShapesGraphListItem();
          listItem.versionedRdfRecord.recordId = entityRecord['@id'];
          component.isEntityRecord = true;
          component.hasCommitInProgress = false;
          listItem.currentVersionTitle = 'Master';
          listItem.versionedRdfRecord.branchId = '';
          component.isOpened = true;
  
          shapesGraphStateStub.list = [listItem];
          fixture.detectChanges();
          component.openShapesGraph();
          expect(router.navigate).toHaveBeenCalledWith(['/shapes-graph-editor']);
          expect(shapesGraphStateStub.open).not.toHaveBeenCalled();
          expect(shapesGraphStateStub.changeVersion).toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(toastStub.createWarningToast).toHaveBeenCalledWith('Switching to MASTER.');
          expect(shapesGraphStateStub.listItem).toEqual(listItem);
        });
      });
    });
    it('openWorkflow navigates to the workflows module ', fakeAsync(() => {
      const schema: WorkflowSchema = {
        iri: '',
        title: '',
        issued: undefined,
        modified: undefined,
        description: '',
        active: false,
        workflowIRI: ''
      };
      workflowsStateStub.convertJSONLDToWorkflowSchema.and.returnValue(of(schema));
      component.openWorkflow();
      tick();
      expect(workflowsStateStub.convertJSONLDToWorkflowSchema).toHaveBeenCalledWith(component.record);
      expect(workflowsStateStub.selectedRecord).toEqual(schema);
      expect(router.navigate).toHaveBeenCalledWith(['/workflows']);
    }));
    describe('handleRecordUpdate sets the appropriate variables', function() {
      beforeEach(function() {
        catalogStateStub.getRecordType.and.returnValue('Test');
        component.record = record;
      });
      it('if the user can view the record', fakeAsync(function() {
        component.handleRecordUpdate();
        tick();
        expect(component.recordType).toEqual('Test');
        expect(component.showButton).toEqual(true);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: record['@id'],
          actionId: policyManagerStub.actionRead
        });
      }));
      it('if the user cannot view the record', fakeAsync(function() {
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
        component.handleRecordUpdate();
        tick();
        expect(component.recordType).toEqual('Test');
        expect(component.showButton).toEqual(false);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: record['@id'],
          actionId: policyManagerStub.actionRead
        });
      }));
    });
    describe('updateEntityRecord should fetch full metadata for a record when component is in the Entity Search page', function() {
      beforeEach(() => {
        component.record = {
          '@id': entityRecord['@id']
        };
        spyOn(component, 'navigateToRecord');
      });
      it('unless an error occurs', fakeAsync(function() {
        catalogManagerStub.getRecord.and.returnValue(throwError(error));
        component.updateEntityRecord();
        tick();
        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(entityRecord['@id'], catalogId);
        expect(component.record).toEqual({'@id': entityRecord['@id']});
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Error fetching'));
        expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
        expect(component.hasCommitInProgress).toBeUndefined();
        expect(component.navigateToRecord).not.toHaveBeenCalled();
      }));
      it('unless no record data is returned', fakeAsync(function() {
        catalogManagerStub.getRecord.and.returnValue(of([]));
        component.updateEntityRecord();
        tick();
        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(entityRecord['@id'], catalogId);
        expect(component.record).toEqual({'@id': entityRecord['@id']});
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('empty'));
        expect(catalogManagerStub.getInProgressCommit).not.toHaveBeenCalled();
        expect(component.hasCommitInProgress).toBeUndefined();
        expect(component.navigateToRecord).not.toHaveBeenCalled();
      }));
      it('if no in progress commit is found', fakeAsync(function() {
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(new HttpErrorResponse({status: 404})));
        component.updateEntityRecord();
        tick();
        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(entityRecord['@id'], catalogId);
        expect(component.record).toEqual(entityRecord);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(entityRecord['@id'], catalogId);
        expect(component.hasCommitInProgress).toBeFalse();
        expect(component.navigateToRecord).toHaveBeenCalledWith();
      }));
      it('if an in progress commit is found', fakeAsync(function() {
        catalogManagerStub.getInProgressCommit.and.returnValue(of(new Difference([{'@id': 'add'}])));
        component.updateEntityRecord();
        tick();
        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(entityRecord['@id'], catalogId);
        expect(component.record).toEqual(entityRecord);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(entityRecord['@id'], catalogId);
        expect(component.hasCommitInProgress).toBeTrue();
        expect(component.navigateToRecord).toHaveBeenCalledWith();
      }));
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('.open-record-button')).length).toEqual(1);
    });
    it('button type depending on whether flat is set', function() {
      component.showButton = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-button')).length).toEqual(0);
      expect(element.queryAll(By.css('.mat-raised-button')).length).toEqual(1);
      
      component.flat = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-button')).length).toEqual(1);
      expect(element.queryAll(By.css('.mat-raised-button')).length).toEqual(0);
    });
    it('depending on showButton being true or false', function() {
      component.showButton = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('button')).length).toEqual(1);

      component.showButton = false;
      fixture.detectChanges();
      expect(element.queryAll(By.css('button')).length).toEqual(0);
    });
    it('should call openRecord when clicked', function() {
      spyOn(component, 'openRecord');
      component.showButton = true;
      fixture.detectChanges();

      const event = new MouseEvent('click');
      const button = element.queryAll(By.css('button'))[0];
      button.triggerEventHandler('click', event);
      expect(component.openRecord).toHaveBeenCalledWith(event);
    });
  });
});
