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
//Angular
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
// libraries
import { Subject, of } from 'rxjs';
import { cloneDeep } from 'lodash';
//local
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { WorkflowSchema } from '../models/workflow-record.interface';
import { condenseCommitId, runningTime, toFormattedDateString } from '../../shared/utility';
import { workflow_data_row_mocks, workflow_mocks } from '../models/mock_data/workflow-mocks';
import { User } from '../../shared/models/user.class';
import { PROV, USER, WORKFLOWS } from '../../prefixes';
import { UserManagerService } from '../../shared/services/userManager.service';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { WorkflowsManagerService } from './workflows-manager.service';
import { LoginManagerService } from '../../shared/services/loginManager.service';
import { EventWithPayload } from '../../shared/models/eventWithPayload.interface';
import { WorkflowStatus } from '../models/workflow-status.type';
import { PaginatedResponse } from '../models/paginated-response.interface';
import { WorkflowPaginatedConfig } from '../models/workflow-paginated-config.interface';
import { WorkflowDataRow } from '../models/workflow-record-table';
import { WorkflowsStateService } from './workflows-state.service';

describe('WorkflowsStateService', () => {
  let service: WorkflowsStateService;
  let workflowManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let userManagerStub: jasmine.SpyObj<UserManagerService>;
  let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
  let loginManageActionSubject: Subject<EventWithPayload>;
  const paginationConfig: WorkflowPaginatedConfig = {
    limit: 10,
    searchText: '',
    ascending: true,
    sortOption: {
      field: 'title',
      asc: true,
      label: ''
    }
  };
  const workflows: WorkflowSchema[] = workflow_mocks;
  const userId = 'urn:user';
  const username = 'username';
  const user: User = new User({
    '@id': userId,
    '@type': [`${USER}User`],
    [`${USER}username`]: [{ '@value': username }]
  });

  beforeEach(async ()  => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
          WorkflowsStateService,
          MockProvider(ProgressSpinnerService),
          MockProvider(WorkflowsManagerService),
          MockProvider(UserManagerService),
          MockProvider(LoginManagerService),
      ]
    });
    
    loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
    loginManageActionSubject = new Subject<EventWithPayload>();
    loginManagerStub.loginManagerAction$ = loginManageActionSubject.asObservable();

    userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
    userManagerStub.users = [user];

    workflowManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    workflowManagerStub.getWorkflowsRecords.and.returnValue(of({page: workflows, totalCount: workflows.length}));

    service = TestBed.inject(WorkflowsStateService);
  });

  afterEach(() => {
    service = null;
    loginManagerStub = null;
    userManagerStub = null;
    workflowManagerStub = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should reset state variables', () => {
    service.selectedRecord = workflow_mocks[0];
    service.landingPageSearchText = 'text';
    service.selectedActivity = {
      executionId: '',
      executionIdLabel: '',
      executorIri: '',
      executorUsername: '',
      executorDisplayName: '',
      startTime: new Date(),
      startTimeLabel: '',
      endTime: new Date(),
      runningTimeLabel: '',
      succeeded: true,
      status: 'success',
      isLatestActivity: false
    };
    service.selectedLogFileIRI = 'urn:log';
    service.selectedWorkflowRdf = [{'@id': 'workflow'}];
    service.reset();
    expect(service.selectedRecord).toBeUndefined();
    expect(service.landingPageSearchText).toEqual('');
    expect(service.selectedActivity).toBeUndefined();
    expect(service.selectedLogFileIRI).toEqual('');
    expect(service.selectedWorkflowRdf).toEqual([]);
  });
  describe('getResults should call the proper methods', function() {
    it('when getResults resolves', async () => {
      await service.getResults(paginationConfig).subscribe((response: PaginatedResponse<WorkflowDataRow[]>) => {
        expect(response).toBeDefined();
        expect(response.totalCount).toEqual(2);
        expect(response.page[0]).toEqual(workflow_data_row_mocks[0]);
        expect(response.page[1]).toEqual(workflow_data_row_mocks[1]);
      });
    });
  });
  describe('should update the details of a workflow based on the provided activity', () => {
    it('if the activity has not ended yet', () => {
      const activity: JSONLDObject = {
        '@id': 'urn:activity',
        '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
        [`${PROV}startedAtTime`]: [{ '@value': '2024-01-01T00:00:00-05:00' }],
        [`${PROV}wasAssociatedWith`]: [{ '@id': userId }]
      };
      const workflowClone = cloneDeep(workflow_data_row_mocks[0]);
      service.updateWorkflowWithActivity(workflowClone, activity);
      expect(workflowClone.record.status).toEqual('started');
      expect(workflowClone.record.executorIri).toEqual(userId);
      expect(workflowClone.record.executorUsername).toEqual(username);
      expect(workflowClone.record.executorDisplayName).toEqual(username);
      expect(workflowClone.record.startTime).toEqual(new Date('2024-01-01T00:00:00-05:00'));
      expect(workflowClone.record.endTime).toBeUndefined();
      expect(workflowClone.executorDisplay).toEqual(username);
      expect(workflowClone.executionIdDisplay).toEqual(condenseCommitId(activity['@id']));
      expect(workflowClone.statusDisplay).toEqual('started');
      expect(workflowClone.startTimeDisplay).toEqual(toFormattedDateString(new Date('2024-01-01T00:00:00-05:00')));
      expect(workflowClone.runningTimeDisplay).toEqual('(none)');
    });
    it('if the activity has ended successfully', () => {
      const activity: JSONLDObject = {
        '@id': 'urn:activity',
        '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
        [`${WORKFLOWS}succeeded`]: [{ '@value': 'true' }],
        [`${PROV}startedAtTime`]: [{ '@value': '2024-01-01T00:00:00-05:00' }],
        [`${PROV}endedAtTime`]: [{ '@value': '2024-01-01T01:00:00-05:00' }],
        [`${PROV}wasAssociatedWith`]: [{ '@id': userId }]
      };
      const workflowClone = cloneDeep(workflow_data_row_mocks[0]);
      service.updateWorkflowWithActivity(workflowClone, activity);
      expect(workflowClone.record.status).toEqual('success');
      expect(workflowClone.record.executorIri).toEqual(userId);
      expect(workflowClone.record.executorUsername).toEqual(username);
      expect(workflowClone.record.executorDisplayName).toEqual(username);
      expect(workflowClone.record.startTime).toEqual(new Date('2024-01-01T00:00:00-05:00'));
      expect(workflowClone.record.endTime).toEqual(new Date('2024-01-01T01:00:00-05:00'));
      expect(workflowClone.executorDisplay).toEqual(username);
      expect(workflowClone.executionIdDisplay).toEqual(condenseCommitId(activity['@id']));
      expect(workflowClone.statusDisplay).toEqual('success');
      expect(workflowClone.startTimeDisplay).toEqual(toFormattedDateString(new Date('2024-01-01T00:00:00-05:00')));
      expect(workflowClone.runningTimeDisplay).toEqual(runningTime(new Date('2024-01-01T00:00:00-05:00'), new Date('2024-01-01T01:00:00-05:00')));
    });
    it('if the activity has ended unsuccessfully', () => {
      const activity: JSONLDObject = {
        '@id': 'urn:activity',
        '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
        [`${WORKFLOWS}succeeded`]: [{ '@value': 'false' }],
        [`${PROV}startedAtTime`]: [{ '@value': '2024-01-01T00:00:00-05:00' }],
        [`${PROV}endedAtTime`]: [{ '@value': '2024-01-01T01:00:00-05:00' }],
        [`${PROV}wasAssociatedWith`]: [{ '@id': userId }]
      };
      const workflowClone = cloneDeep(workflow_data_row_mocks[0]);
      service.updateWorkflowWithActivity(workflowClone, activity);
      expect(workflowClone.record.status).toEqual('failure');
      expect(workflowClone.record.executorIri).toEqual(userId);
      expect(workflowClone.record.executorUsername).toEqual(username);
      expect(workflowClone.record.executorDisplayName).toEqual(username);
      expect(workflowClone.record.startTime).toEqual(new Date('2024-01-01T00:00:00-05:00'));
      expect(workflowClone.record.endTime).toEqual(new Date('2024-01-01T01:00:00-05:00'));
      expect(workflowClone.executorDisplay).toEqual(username);
      expect(workflowClone.executionIdDisplay).toEqual(condenseCommitId(activity['@id']));
      expect(workflowClone.statusDisplay).toEqual('failure');
      expect(workflowClone.startTimeDisplay).toEqual(toFormattedDateString(new Date('2024-01-01T00:00:00-05:00')));
      expect(workflowClone.runningTimeDisplay).toEqual(runningTime(new Date('2024-01-01T00:00:00-05:00'), new Date('2024-01-01T01:00:00-05:00')));
    });
  });
  it('should fetch the correct CSS classes for a WorkflowStatus', () => {
    const statuses: WorkflowStatus[] = ['failure', 'never_run', 'started', 'success'];
    const actualClasses = statuses.map(s => service.getStatusClass(s));
    const expectedClasses = ['bg-danger text-white', 'bg-light text-dark', 'bg-info text-white', 'bg-success text-white'];
    expect(expectedClasses).toEqual(actualClasses);
  });
});
