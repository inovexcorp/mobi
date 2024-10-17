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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import {
  cleanStylesFromDOM,
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
import { OpenRecordButtonComponent } from './openRecordButton.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { HttpResponse } from '@angular/common/http';
import { EntityNamesItem } from '../../../shared/models/entityNamesItem.interface';

describe('Open Record Button component', function () {
  let component: OpenRecordButtonComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<OpenRecordButtonComponent>;
  let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let mapperStateStub: jasmine.SpyObj<MapperStateService>;
  let ontologyStateStub: jasmine.SpyObj<OntologyStateService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let router: Router;

  const recordId = 'recordId';
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
        MockProvider(MapperStateService),
        MockProvider(OntologyStateService),
        MockProvider(WorkflowsStateService),
        MockProvider(PolicyEnforcementService),
        MockProvider(PolicyManagerService),
        MockProvider(ToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OpenRecordButtonComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    ontologyStateStub = TestBed.inject(OntologyStateService) as jasmine.SpyObj<OntologyStateService>;
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
    catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [entityRecord]})));
    catalogManagerStub.getRecordMasterBranch.and.callFake(() => of(branch));
    policyEnforcementStub.permit = 'Permit';
    policyEnforcementStub.deny = 'Deny';
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    catalogStateStub = null;
    mapperStateStub = null;
    catalogManagerStub = null;
    ontologyStateStub = null;
    workflowsStateStub = null;
    policyEnforcementStub = null;
    toastStub = null;
    router = null;
  });

  it('should initialize correctly on record change', function() {
    spyOn(component, 'update');
    component.record = record;
    expect(component.update).toHaveBeenCalledWith();
  });
  describe('controller methods', function() {
    describe('openRecord calls the correct method when record is a', function() {
      beforeEach(function() {
        component.stopProp = true;
        this.event = new MouseEvent('click');
        spyOn(this.event, 'stopPropagation');
      });
      it('OntologyRecord', function() {
        component.recordType = `${ONTOLOGYEDITOR}OntologyRecord`;
        spyOn(component, 'openOntology');
        component.openRecord(this.event);
        expect(component.openOntology).toHaveBeenCalledWith();
        expect(this.event.stopPropagation).toHaveBeenCalledWith();
      });
      it('MappingRecord', function() {
        component.recordType = `${DELIM}MappingRecord`;
        spyOn(component, 'openMapping');
        component.openRecord(this.event);
        expect(component.openMapping).toHaveBeenCalledWith();
      });
      it('DatasetRecord', function() {
        component.recordType = `${DATASET}DatasetRecord`;
        spyOn(component, 'openDataset');
        component.openRecord(this.event);
        expect(component.openDataset).toHaveBeenCalledWith();
      });
      it('ShapesGraphRecord', function() {
        component.recordType = `${SHAPESGRAPHEDITOR}ShapesGraphRecord`;
        spyOn(component, 'openShapesGraph');
        component.openRecord(this.event);
        expect(component.openShapesGraph).toHaveBeenCalledWith();
      });
      it('WorkflowRecord', function() {
        component.recordType = `${WORKFLOWS}WorkflowRecord`;
        spyOn(component, 'openWorkflow');
        component.openRecord(this.event);
        expect(component.openWorkflow).toHaveBeenCalledWith();
      });
      it('Entity Search results is an Ontology Record', function () {
        component.recordType = `${ONTOLOGYEDITOR}OntologyRecord`;
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(error));
        spyOn(component, 'openOntology');
        spyOn(component, 'updateEntityRecord');
        component.openRecord(this.event);
        expect(component.openOntology).toHaveBeenCalledWith();
        expect(this.event.stopPropagation).toHaveBeenCalledWith();
      });
    });
    describe('openOntology navigates to the ontology editor', function() {
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
    describe('Entity record openOntology and navigates to the ontology editor', function () {
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
    describe('Entity record ShapeGraphs', function () {
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
      component.openDataset();
      expect(router.navigate).toHaveBeenCalledWith(['/datasets']);
    });
    describe('openShapesGraphRecord navigates to the shapes editor', function() {
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
    describe('update set the appropriate variables', function() {
      beforeEach(function() {
        component.record = record;
      });
      it('when it is not an ontology record', function() {
        catalogStateStub.getRecordType.and.returnValue('Test');
        component.update();
        expect(component.recordType).toEqual('Test');
        expect(component.showButton).toEqual(true);
        expect(policyEnforcementStub.evaluateRequest).not.toHaveBeenCalled();
      });
      describe('when it is an ontology record and', function() {
        beforeEach(function() {
          catalogStateStub.getRecordType.and.returnValue(`${ONTOLOGYEDITOR}OntologyRecord`);
        });
        it('the user can view', fakeAsync(function() {
          policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
          component.update();
          tick();
          expect(component.recordType).toEqual(`${ONTOLOGYEDITOR}OntologyRecord`);
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: policyManagerStub.actionRead});
          expect(component.showButton).toEqual(true);
        }));
        it('the user cannot view', fakeAsync(function() {
          policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
          component.update();
          tick();
          expect(component.recordType).toEqual(`${ONTOLOGYEDITOR}OntologyRecord`);
          expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({resourceId: recordId, actionId: policyManagerStub.actionRead});
          expect(component.showButton).toEqual(false);
        }));
      });
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
