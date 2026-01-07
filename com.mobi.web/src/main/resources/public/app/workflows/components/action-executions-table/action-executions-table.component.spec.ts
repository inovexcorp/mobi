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
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';

import { MockProvider } from 'ng-mocks';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { WORKFLOWS } from '../../../prefixes';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { runningTime, toFormattedDateString } from '../../../shared/utility';
import { ActionExecutionsTableComponent } from './action-executions-table.component';

describe('ActionExecutionsTableComponent', () => {
  let component: ActionExecutionsTableComponent;
  let fixture: ComponentFixture<ActionExecutionsTableComponent>;
  let element: DebugElement;

  const startDate = new Date();
  const endDate = new Date();
  const succeededActionExec: JSONLDObject = {
    '@id': 'succeeded',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'succeededAction' }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'true' }],
    [`${WORKFLOWS}startedAt`]: [{ '@value': startDate.toISOString() }],
    [`${WORKFLOWS}endedAt`]: [{ '@value': endDate.toISOString() }]
  };
  const failedActionExec: JSONLDObject = {
    '@id': 'failed',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'failedAction' }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'false' }],
    [`${WORKFLOWS}startedAt`]: [{ '@value': startDate.toISOString() }],
    [`${WORKFLOWS}endedAt`]: [{ '@value': endDate.toISOString() }]
  };
  const skippedActionExec: JSONLDObject = {
    '@id': 'skipped',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'skippedAction' }],
  };
  const missingActionExec: JSONLDObject = {
    '@id': 'missing',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'missingAction' }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'true' }],
    [`${WORKFLOWS}startedAt`]: [{ '@value': startDate.toISOString() }],
    [`${WORKFLOWS}endedAt`]: [{ '@value': endDate.toISOString() }]
  };
  const workflow: JSONLDObject[] = [
    { '@id': 'workflow', '@type': [`${WORKFLOWS}Workflow`] },
    { '@id': 'succeededAction', '@type': [`${WORKFLOWS}Action`] },
    { '@id': 'failedAction', '@type': [`${WORKFLOWS}Action`] },
    { '@id': 'skippedAction', '@type': [`${WORKFLOWS}Action`] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatTableModule
      ],
      declarations: [ ActionExecutionsTableComponent ],
      providers: [
        MockProvider(WorkflowsStateService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionExecutionsTableComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize correctly', () => {
    component.actions = [succeededActionExec, failedActionExec, skippedActionExec, missingActionExec];
    component.workflowRdf = workflow;
    component.ngOnChanges();
    expect(component.dataSource.data).toEqual([
      // Missing Action
      {
        iri: missingActionExec['@id'],
        displayName: '(Action Not Found)',
        statusDisplay: 'success',
        startTimeDisplay: toFormattedDateString(startDate),
        runningTimeDisplay: runningTime(startDate, endDate)
      },
      // Failed Action
      {
        iri: failedActionExec['@id'],
        displayName: 'Failed Action',
        statusDisplay: 'failure',
        startTimeDisplay: toFormattedDateString(startDate),
        runningTimeDisplay: runningTime(startDate, endDate)
      },
      // Skipped Action
      {
        iri: skippedActionExec['@id'],
        displayName: 'Skipped Action',
        statusDisplay: 'never_run',
        startTimeDisplay: '(none)',
        runningTimeDisplay: '(none)'
      },
      // Succeeded Action
      {
        iri: succeededActionExec['@id'],
        displayName: 'Succeeded Action',
        statusDisplay: 'success',
        startTimeDisplay: toFormattedDateString(startDate),
        runningTimeDisplay: runningTime(startDate, endDate)
      }
    ]);
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.action-executions-table')).length).toEqual(1);
      expect(element.queryAll(By.css('.mat-table')).length).toEqual(1);
    });
    it('with rows for the results', () => {
      expect(element.queryAll(By.css('.mat-table tbody tr')).length).toEqual(0);
      component.actions = [succeededActionExec, failedActionExec, skippedActionExec, missingActionExec];
      component.workflowRdf = workflow;
      component.ngOnChanges();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-table tbody tr')).length).toEqual(4);
    });
  });
});
