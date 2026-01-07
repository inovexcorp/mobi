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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { MockComponent } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ShaclValidationReportComponent } from '../shacl-validation-report/shacl-validation-report.component';
import { WorkflowCommitErrorModalComponent } from './workflow-commit-error-modal.component';

describe('WorkflowCommitErrorModalComponent', () => {
  let component: WorkflowCommitErrorModalComponent;
  let fixture: ComponentFixture<WorkflowCommitErrorModalComponent>;
  let element: DebugElement;

  const errorObject: RESTError = Object.freeze({
    error: 'InvalidWorkflowException',
    errorMessage: 'Something went wrong',
    errorDetails: [
      '<urn:test> a <urn:Class> ;',
      '  <urn:prop> true .'
    ]
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatButtonModule,
        MatDialogModule
      ],
      declarations: [
        WorkflowCommitErrorModalComponent,
        MockComponent(ErrorDisplayComponent),
        MockComponent(ShaclValidationReportComponent)
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { errorObject } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowCommitErrorModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('if the error is an InvalidWorkflowException', () => {
      const errorDisplay = element.queryAll(By.css('error-display'));
      expect(errorDisplay.length).toEqual(1);
      expect(errorDisplay[0].nativeElement.innerHTML).toContain(errorObject.errorMessage);
      expect(element.queryAll(By.css('app-shacl-validation-report')).length).toEqual(1);
    });
    it('if the error was some other kind of exception', () => {
      component.data.errorObject = cloneDeep(errorObject);
      component.data.errorObject.error = 'IllegalArgumentException';
      fixture.detectChanges();
      const errorDisplay = element.queryAll(By.css('error-display'));
      expect(errorDisplay.length).toEqual(1);
      expect(errorDisplay[0].nativeElement.innerHTML).toContain(errorObject.errorMessage);
      expect(element.queryAll(By.css('app-shacl-validation-report')).length).toEqual(0);
    });
    it('with a button to cancel', function() {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(1);
      expect(buttons[0].nativeElement.textContent.trim()).toContain('Cancel');
    });
  });
});
