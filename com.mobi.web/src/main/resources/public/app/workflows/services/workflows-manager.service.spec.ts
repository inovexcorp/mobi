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
// Angular
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MockProvider } from 'ng-mocks';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
// Libraries
import { Observable, of, throwError } from 'rxjs';
// local imports
import { CATALOG, WORKFLOWS } from '../../prefixes';
import { CatalogManagerService } from '../../shared/services/catalogManager.service';
import { Difference } from '../../shared/models/difference.class';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { PolicyEnforcementService } from '../../shared/services/policyEnforcement.service';
import { PolicyManagerService } from '../../shared/services/policyManager.service';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../../shared/models/RESTError.interface';
import { SSEEvent } from '../../shared/models/sse-event';
import { SseService } from '../../shared/services/sse.service';
import { workflow_mocks, workflowRecordJSONLD } from '../models/mock_data/workflow-mocks';
import { WorkflowPaginatedConfig } from '../models/workflow-paginated-config.interface';
import { WorkflowRecordConfig } from '../models/workflowRecordConfig.interface';
import { XACMLDecision } from '../../shared/models/XACMLDecision.interface';
import { WorkflowsManagerService, WorkflowActivitySSEEvent } from './workflows-manager.service';

describe('WorkflowsManagerService', () => {
  let service: WorkflowsManagerService;
  let httpMock: HttpTestingController;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
  let sseStub: jasmine.SpyObj<SseService>;

  const catalogId = 'catalogId';
  const recordId = 'recordId';
  const error: RESTError = {
    errorMessage: 'Error Message',
    error: '',
    errorDetails: []
  };
  const fakePermissionPermit: XACMLDecision[] = [
    {
      'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:action': 'http://mobi.com/ontologies/policy#Delete',
      'decision': 'Permit'
    }
  ];
  const fakePermissionDeny: XACMLDecision[] = [
    {
      'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:action': 'http://mobi.com/ontologies/policy#Delete',
      'decision': 'Not-Permitted'
    }
  ];
  const paginationConfig: WorkflowPaginatedConfig = {
    limit: 20,
    pageIndex: 0,
    searchText: '',
    offset: 0,
    sortOption: {
      field: undefined,
      asc: true,
      label: undefined
    }
  };
  const workflowId = 'urn:workflow';
  const activity: JSONLDObject = {
    '@id': 'urn:activity',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`]
  };
  const logId = 'urn:this/is/a/log/iri.log';

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
          WorkflowsManagerService,
          MockProvider(CatalogManagerService),
          MockProvider(ProgressSpinnerService),
          MockProvider(SseService),
          MockProvider(PolicyEnforcementService),
          MockProvider(PolicyManagerService),
      ]
    });
    httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    sseStub = TestBed.inject(SseService) as jasmine.SpyObj<SseService>;
    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    policyEnforcementStub.permit = 'Permit';
    policyEnforcementStub.deny = 'Deny';
    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
    policyManagerStub = TestBed.inject(PolicyManagerService) as jasmine.SpyObj<PolicyManagerService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = { '@id': catalogId };
    progressSpinnerStub.track.and.callFake(ob => ob);
    progressSpinnerStub.trackedRequest.and.callFake(ob => ob);
    service = TestBed.inject(WorkflowsManagerService);
  });

  afterEach(function() {
    service = null;
    httpMock = null;
    progressSpinnerStub = null;
    policyManagerStub = null;
    sseStub = null;
    policyEnforcementStub = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('create workflow record when', () => {
    const file = new File(['file content'], 'filename.txt');
    const newWorkflowWithFile: WorkflowRecordConfig = {
      title: 'Test Workflow',
      description: 'Test Description',
      file: file,
      keywords: ['test', 'workflow']
    };
    it('should create a workflow record with file', () => {
      const formData = new FormData();

      formData.append('title', newWorkflowWithFile.title);
      formData.append('description', newWorkflowWithFile.description);
      formData.append('file', newWorkflowWithFile.file);
      formData.append('keywords', 'test');
      formData.append('keywords', 'workflow');
  
      service.createWorkflowRecord(newWorkflowWithFile).subscribe();
  
      const req = httpMock.expectOne(service.workflows_prefix);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body instanceof FormData).toBeTruthy();
      expect(req.request.body.get('title')).toEqual(newWorkflowWithFile.title);
      expect(req.request.body.get('description')).toEqual(newWorkflowWithFile.description);
      expect(req.request.body.get('file')).toEqual(newWorkflowWithFile.file);
      expect(req.request.body.getAll('keywords')).toEqual(['test', 'workflow']);
  
      req.flush('success');
    });
    it('should create a workflow record without file', () => {
      const formData = new FormData();
      const newWorkflow: WorkflowRecordConfig = {
        title: 'Test Workflow',
        description: 'Test Description',
        jsonld: [activity],
        keywords: ['test', 'workflow']
      };
      formData.append('title', newWorkflow.title);
      formData.append('description', newWorkflow.description);
      formData.append('jsonld', JSON.stringify(newWorkflow.jsonld));
      formData.append('keywords', 'test');
      formData.append('keywords', 'workflow');
  
      service.createWorkflowRecord(newWorkflow).subscribe();
  
      const req = httpMock.expectOne(service.workflows_prefix);
      expect(req.request.method).toEqual('POST');
      expect(req.request.body instanceof FormData).toBeTruthy();
      expect(req.request.body.get('title')).toEqual(newWorkflow.title);
      expect(req.request.body.get('description')).toEqual(newWorkflow.description);
      expect(req.request.body.get('jsonld')).toEqual(JSON.stringify(newWorkflow.jsonld));
      expect(req.request.body.getAll('keywords')).toEqual(['test', 'workflow']);
  
      req.flush('success');
    });
    it('should handle error during creation', () => {
      service.createWorkflowRecord(newWorkflowWithFile).subscribe(
        () => fail('Expected error, but got success response'),
        error => {
          expect(error).toBeTruthy();
        }
      );
  
      const req = httpMock.expectOne(service.workflows_prefix);
      req.error(new ErrorEvent('network error'));
    });
  });
  describe('should retrieve workflows record', () => {
    beforeEach(() => {
      spyOn(service, 'checkMasterBranchPermissions').and.returnValue(of(true));
      spyOn(service, 'checkMultiWorkflowDeletePermissions').and.returnValue(of(fakePermissionPermit));
      policyManagerStub.resourceCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:resource';
    });
    it('unless an error occurs', function() {
      service.getWorkflowsRecords(paginationConfig)
          .subscribe(() => fail('Observable should have failed'), response => {
            expect(response).toEqual(error);
            expect(service.checkMasterBranchPermissions).not.toHaveBeenCalled();
          });
      const request = httpMock.expectOne(req => req.method === 'GET' && req.url === service.workflows_prefix );
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
    it('successfully', async () => {
      service.getWorkflowsRecords(paginationConfig)
          .subscribe(response => {
            expect(response.page).toEqual([workflow_mocks[1]]);
            expect(response.totalCount).toEqual(1);
            expect(service.checkMasterBranchPermissions).toHaveBeenCalledWith(workflow_mocks[1].master, workflow_mocks[1].iri);
            expect(service.checkMultiWorkflowDeletePermissions).toHaveBeenCalledWith([workflow_mocks[1]]);
          }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === service.workflows_prefix && req.method === 'GET');
      expect(request.request.params.get('limit')).toEqual('' + paginationConfig.limit);
      expect(request.request.params.get('offset')).toEqual('' + paginationConfig.offset);
      expect(request.request.params.get('ascending')).toEqual('' + paginationConfig.sortOption.asc);
      request.flush([workflow_mocks[1]], { headers: {'x-total-count': '1'}, status: 200, statusText: 'success' });
    });
  });
  describe('should execute a workflow', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/${encodeURIComponent(workflow_mocks[0].iri)}/executions`;
    });
    it('unless an error occurs', () => {
      service.executeWorkflow(workflow_mocks[0].iri)
        .subscribe(
          () => fail('Observable should have failed'),
          response => {
            expect(response).toEqual(error);
          }
        );
      const request = httpMock.expectOne(req =>
        req.method === 'POST' &&
        req.url === url
      );
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
    it('successfully', () => {
      service.executeWorkflow(workflow_mocks[0].iri)
        .subscribe(response => {
          expect(response).toBeTruthy();
        }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => 
        req.method === 'POST' &&
        req.url === url);
      request.flush('flush', { status: 200, statusText: 'success' });
    });
  });
  describe('should retrieve the latest execution activity of a WorkflowRecord', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/latest`;
    });
    it('successfully', () => {
      service.getLatestExecutionActivity(workflowId).subscribe(response => {
        expect(response).toEqual(activity);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(activity);
    });
    it('when tracked elsewhere', () => {
      service.getLatestExecutionActivity(workflowId, true).subscribe(response => {
        expect(response).toEqual(activity);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(activity);
    });
    it('unless an error occurs', () => {
      service.getLatestExecutionActivity(workflowId).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
      });
      const request = httpMock.expectOne(req => req.url === `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/latest` && req.method === 'GET');
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
  });
  describe('should retrieve a specific execution activity of a WorkflowRecord', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}`;
    });
    it('successfully', () => {
      service.getWorkflowExecutionActivity(workflowId, activity['@id']).subscribe(response => {
        expect(response).toEqual(activity);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(activity);
    });
    it('when tracked elsewhere', () => {
      service.getWorkflowExecutionActivity(workflowId, activity['@id'], true).subscribe(response => {
        expect(response).toEqual(activity);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(activity);
    });
    it('unless an error occurs', () => {
      service.getWorkflowExecutionActivity(workflowId, activity['@id']).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
      });
      const request = httpMock.expectOne(req => req.url === `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}` && req.method === 'GET');
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
  });
  describe('should retrieve ActionExecutions of a WorkflowExecutionActivity', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/actions`;
    });
    it('successfully', () => {
      service.getActionExecutions(workflowId, activity['@id']).subscribe(response => {
        expect(response).toEqual([]);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush([]);
    });
    it('unless an error occurs', () => {
      service.getActionExecutions(workflowId, activity['@id']).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
      });
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
  });
  it('should get an Observable of WorkflowActivitySSEEvents', fakeAsync(() => {
    const event: WorkflowActivitySSEEvent = {
      type: 'com/mobi/workflows/activities',
      data: []
    };
    const otherEvent: SSEEvent = {
      type: 'other',
      data: []
    };
    sseStub.getEvents.and.returnValue(of(event, otherEvent));
    service.getWorkflowEvents().subscribe({
      next: response => {
        expect(response).toEqual(event);
      }
    });
    tick();
  }));
  describe('should retrieve currently running WorkflowExecutionActivity instances', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/executing-activities`;
    });
    it('successfully', () => {
      service.getExecutingActivities().subscribe(response => {
        expect(response).toEqual([]);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush([]);
    });
    it('unless an error occurs', () => {
      service.getExecutingActivities().subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
      });
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
  });
  describe('checkMasterBranchPermissions should return appropriate response', function() {
    beforeEach(() => {
      policyEnforcementStub.permit = 'Permit';
    });
    it('when they do not have permission', async () => {
      policyEnforcementStub.permit = 'Permit';
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Not Permitted'));
      service.checkMasterBranchPermissions('mockMasterBranchIRI', 'mockWorkflowRecordIRI').subscribe(response => {
        expect(response).toBe(false);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: 'mockWorkflowRecordIRI',
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: 'mockMasterBranchIRI' }
        });
      });
    });
    it('when they do have permission', async () => {
      policyEnforcementStub.permit = 'Permit';
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
      service.checkMasterBranchPermissions('mockMasterBranchIRI', 'mockWorkflowRecordIRI').subscribe(response => {
        expect(response).toBe(true);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: 'mockWorkflowRecordIRI',
          actionId: policyManagerStub.actionModify,
          actionAttrs: { [`${CATALOG}branch`]: 'mockMasterBranchIRI' }
        });
      });
    });
  });
  describe('checkCreatePermission should return appropriate response', function() {
    beforeEach(() => {
      policyEnforcementStub.permit = 'Permit';
    });
    it('when they do not have permission', () => {
      policyEnforcementStub.permit = 'Permit';
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Not Permitted'));
      service.checkCreatePermission().subscribe(response => {
        expect(response).not.toBe(policyEnforcementStub.permit);
      });
    });
    it('when they do have permission', () => {
      policyEnforcementStub.permit = 'Permit';
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
      service.checkCreatePermission().subscribe(response => {
        expect(response).toBe(policyEnforcementStub.permit);
      });
    });
  });
  describe('checkMultiWorkflowDeletePermissions should return appropriate response', function() {
    it('when they do not have permission', async () => {
      policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue(of([{
        'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
        'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
        'urn:oasis:names:tc:xacml:3.0:attribute-category:action': 'http://mobi.com/ontologies/policy#Delete',
        'decision': 'Not-Permitted'
      }]));
      service.checkMultiWorkflowDeletePermissions([workflow_mocks[1]]).subscribe(response => {
        expect(response).not.toEqual(fakePermissionPermit);
        expect(response).toEqual(fakePermissionDeny);
      });
    });
    it('when they do have permission', async () => {
      policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue(of([{
        'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
        'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
        'urn:oasis:names:tc:xacml:3.0:attribute-category:action': 'http://mobi.com/ontologies/policy#Delete',
        'decision': 'Permit'
      }]));
      service.checkMultiWorkflowDeletePermissions([workflow_mocks[1]]).subscribe(response => {
        expect(response).toEqual(fakePermissionPermit);
      });
    });
  });
  describe('checkDeletePermissions should return appropriate response', function() {
    beforeEach(() => {
      policyEnforcementStub.permit = 'Permit';
    });
    it('when they do not have permission', async () => {
      policyEnforcementStub.permit = 'Permit';
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Not Permitted'));
      service.checkDeletePermissions('mockWorkflowRecordIRI').subscribe(response => {
        expect(response).toBe(false);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: 'mockWorkflowRecordIRI',
          actionId: policyManagerStub.actionDelete,
        });
      });
    });
    it('when they do have permission', async () => {
      policyEnforcementStub.permit = 'Permit';
      policyEnforcementStub.evaluateRequest.and.returnValue(of('Permit'));
      service.checkDeletePermissions('mockWorkflowRecordIRI').subscribe(response => {
        expect(response).toBe(true);
        expect(policyEnforcementStub.evaluateRequest).toHaveBeenCalledWith({
          resourceId: 'mockWorkflowRecordIRI',
          actionId: policyManagerStub.actionDelete,
        });
      });
    });
  });
  describe('should update workflow status', () => {
    it('unless an error occurs', fakeAsync( () => {
      catalogManagerStub.getRecord.and.returnValue(throwError('Error Message'));
      spyOn(service, 'checkMasterBranchPermissions').and.returnValue(of(true));
      catalogManagerStub.getRecord.and.returnValue(throwError('Error Message'));
      spyOn(service, 'updateWorkflowStatus').and.returnValue(throwError('Error Message'));
      service.updateWorkflowActiveStatus('id', true)
          .subscribe(() => fail('Observable should have rejected'), response => {
            expect(response).toEqual(error.errorMessage);
            expect(service.updateWorkflowStatus).not.toHaveBeenCalled();
          });
      tick();
    }));
    it('successfully', async () => {
      spyOn(service, 'checkMasterBranchPermissions').and.returnValue(of(true));
      catalogManagerStub.getRecord.and.returnValue(of(workflowRecordJSONLD));
      spyOn(service,'updateWorkflowStatus').and.returnValue(of(workflowRecordJSONLD));
      service.updateWorkflowActiveStatus('id', true)
          .subscribe(response => {
            expect(response).toEqual(workflowRecordJSONLD);
            expect(catalogManagerStub.getRecord).toHaveBeenCalledWith('id', catalogId);
            expect(service.updateWorkflowStatus).toHaveBeenCalledWith(workflowRecordJSONLD, true);
          }, () => fail('Observable should have resolved'));
    });
  });
  describe('should retrieve a preview of the workflow execution logs', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/logs`;
    });
    it('unless an error occurs', () => {
      service.getExecutionLogs(workflowId, activity['@id']).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
    it('successfully', () => {
      service.getExecutionLogs(workflowId, activity['@id']).subscribe(response => {
        expect(response.body).toEqual('logs');
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush('logs');
    });
    it('tracked elsewhere', () => {
      service.getExecutionLogs(workflowId, activity['@id'], true).subscribe(response => {
        expect(response.body).toEqual('logs');
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush('logs');
    });
  });
  it('should download the workflow execution logs', () => {
    spyOn(window, 'open');
    service.downloadExecutionLogs(workflowId, activity['@id']);
    expect(window.open).toHaveBeenCalledWith(`${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/logs`);
  });
  it('should not download the workflow execution logs when permission is denied', () => {
    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
    spyOn(window, 'open');
    service.downloadExecutionLogs(workflowId, activity['@id']);
    expect(window.open).not.toHaveBeenCalledWith(`${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/logs`);
  });
  describe('uploadChanges', () => {
    it('should upload changes successfully', () => {
      const branchId = 'branchId';
      const commitId = 'commitId';
      const file = new File(['file content'], 'filename.txt');

      service.uploadChanges(recordId, branchId, commitId, file).subscribe(() => {
        expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
      });
      const expectedUrl = `${service.workflows_prefix}/${encodeURIComponent(recordId)}/`;
      const req = httpMock.expectOne(req => req.method === 'PUT' && req.url === expectedUrl);
      expect(req.request.params.get('branchId')).toEqual(branchId);
      expect(req.request.params.get('commitId')).toEqual(commitId);
      req.flush('response', { status: 200, statusText: 'Ok' });
    });
    it('should handle errors during upload', () => {
      const recordId = 'recordId';
      const branchId = 'branchId';
      const commitId = 'commitId';
      const file = new File(['file contents'], 'filename');
      const expectedUrl = `${service.workflows_prefix}/${encodeURIComponent(recordId)}/`; // Construct URL manually

      service.uploadChanges(recordId, branchId, commitId, file).subscribe({
        next: () => {
          expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
          fail('Should not emit a next value');
        },
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(req => {
        return req.method === 'PUT' && req.url === expectedUrl;
      });
      expect(req.request.method).toBe('PUT');

      req.flush('Error occurred', { status: 500, statusText: 'Internal Server Error' });
    });
  });
  describe('should retrieve a preview of a specific workflow log', () => {
    let url;
    beforeEach(() => {
      url = `${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/logs/${encodeURIComponent(logId)}`;
    });
    it('unless an error occurs', () => {
      service.getSpecificLog(workflowId, activity['@id'], logId).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(error);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush(error, { status: 400, statusText: error.errorMessage });
    });
    it('successfully', () => {
      service.getSpecificLog(workflowId, activity['@id'], logId).subscribe(response => {
        expect(response.body).toEqual('logs');
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush('logs');
    });
    it('tracked elsewhere', () => {
      service.getSpecificLog(workflowId, activity['@id'], logId, true).subscribe(response => {
        expect(response.body).toEqual('logs');
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => fail('Observable should have resolved'));
      const request = httpMock.expectOne(req => req.url === url && req.method === 'GET');
      request.flush('logs');
    });
  });
  it('should download a specific workflow log', () => {
    spyOn(window, 'open');
    service.downloadSpecificLog(workflowId, activity['@id'], logId);
    expect(window.open).toHaveBeenCalledWith(`${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/logs/${encodeURIComponent(logId)}`);
  });
  it('should not download a specific workflow log when permission is denied', () => {
    policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
    spyOn(window, 'open');
    service.downloadSpecificLog(workflowId, activity['@id'], logId);
    expect(window.open).not.toHaveBeenCalledWith(`${service.workflows_prefix}/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(activity['@id'])}/logs/${encodeURIComponent(logId)}`);
  });
  describe('should update a WorkflowRecord InProgressCommit', () => {
    const diff = new Difference();
    it('unless an error occurs', fakeAsync(() => {
      catalogManagerStub.getInProgressCommit.and.returnValue(throwError(new HttpErrorResponse({status: 500, statusText: error.errorMessage})));
      service.updateWorkflowConfiguration(diff, recordId)
        .subscribe(() => fail('Observable should have failed'), result => {
          expect(result).toEqual(error.errorMessage);
        });
      tick();
      expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
      expect(catalogManagerStub.createInProgressCommit).not.toHaveBeenCalled();
      expect(catalogManagerStub.updateInProgressCommit).not.toHaveBeenCalled();
    }));
    describe('if it exists', () => {
      beforeEach(() => {
        catalogManagerStub.getInProgressCommit.and.returnValue(of(new Difference()));
      });
      it('unless an error occurs', fakeAsync(() => {
        catalogManagerStub.updateInProgressCommit.and.returnValue(throwError(new HttpErrorResponse({status: 500, statusText: error.errorMessage})));
        service.updateWorkflowConfiguration(diff, recordId)
          .subscribe(() => fail('Observable should have failed'), result => {
            expect(result).toEqual(error.errorMessage);
          });
        tick();
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(catalogManagerStub.createInProgressCommit).not.toHaveBeenCalled();
        expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId, diff);
      }));
      it('successfully', fakeAsync(() => {
        catalogManagerStub.updateInProgressCommit.and.returnValue(of(null));
        service.updateWorkflowConfiguration(diff, recordId)
          .subscribe(() => {
            expect(true).toEqual(true);
          });
        tick();
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(catalogManagerStub.createInProgressCommit).not.toHaveBeenCalled();
        expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId, diff);
      }));
    });
    describe('if it does not exist', () => {
      beforeEach(() => {
        catalogManagerStub.getInProgressCommit.and.returnValue(throwError(new HttpErrorResponse({status: 404})));
      });
      it('unless an error occurs', fakeAsync(() => {
        catalogManagerStub.createInProgressCommit.and.returnValue(throwError(new HttpErrorResponse({status: 500, statusText: error.errorMessage})));
        service.updateWorkflowConfiguration(diff, recordId)
          .subscribe(() => fail('Observable should have failed'), result => {
            expect(result).toEqual(error.errorMessage);
          });
        tick();
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(catalogManagerStub.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(catalogManagerStub.updateInProgressCommit).not.toHaveBeenCalled();
      }));
      it('successfully', fakeAsync(() => {
        catalogManagerStub.createInProgressCommit.and.returnValue(of(null));
        catalogManagerStub.updateInProgressCommit.and.returnValue(of(null));
        service.updateWorkflowConfiguration(diff, recordId)
          .subscribe(() => {
            expect(true).toEqual(true);
          });
        tick();
        expect(catalogManagerStub.getInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(catalogManagerStub.createInProgressCommit).toHaveBeenCalledWith(recordId, catalogId);
        expect(catalogManagerStub.updateInProgressCommit).toHaveBeenCalledWith(recordId, catalogId, diff);
      }));
    });
  });
});
