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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { LogLevelOption } from '../log-level-manager/log-level-manager.component';
import { LogLevelSelectComponent } from '../log-level-select/log-level-select.component';
import { LogsManagerService } from '../../../shared/services/logs-manager.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { AddLoggerModalComponent } from './add-logger-modal.component';

describe('AddLoggerModalComponent', () => {
  let component: AddLoggerModalComponent;
  let fixture: ComponentFixture<AddLoggerModalComponent>;
  let element: DebugElement;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<AddLoggerModalComponent>>;
  let logsManagerStub: jasmine.SpyObj<LogsManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const availableLevels: LogLevelOption[] = [
    { level: 'DEBUG', icon: 'bug_report' },
    { level: 'INFO', icon: 'info' },
    { level: 'WARN', icon: 'warning' },
    { level: 'ERROR', icon: 'error' }
  ];
  const error: RESTError = {
    error: 'Error',
    errorMessage: 'Error Message',
    errorDetails: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatDialogModule,
        MatInputModule
      ],
      declarations: [
        AddLoggerModalComponent,
        MockComponent(ErrorDisplayComponent),
        MockComponent(LogLevelSelectComponent)
      ],
      providers: [
        MockProvider(LogsManagerService),
        MockProvider(ToastService),
        { provide: MAT_DIALOG_DATA, useValue: { availableLevels } },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
      ]
    }).compileComponents();

    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AddLoggerModalComponent>>;
    logsManagerStub = TestBed.inject(LogsManagerService) as jasmine.SpyObj<LogsManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    fixture = TestBed.createComponent(AddLoggerModalComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    logsManagerStub = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('component method', () => {
    describe('addLogger should create a logger based on the form data', () => {
      const loggerName = 'com.mobi.test';
      const level = availableLevels[1];
      beforeEach(() => {
        component.addForm.controls.name.setValue(loggerName);
        component.addForm.controls.level.setValue(level);
      });
      it('successfully', fakeAsync(() => {
        logsManagerStub.createLogger.and.returnValue(of({ loggerName, level: level.level }));
        component.addLogger();
        tick();
        expect(logsManagerStub.createLogger).toHaveBeenCalledOnceWith(loggerName, level.level);
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.stringContaining(loggerName));
        expect(matDialogRef.close).toHaveBeenCalledWith(true);
        expect(component.error).toBeUndefined();
      }));
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.createLogger.and.returnValue(throwError(error));
        component.addLogger();
        tick();
        expect(logsManagerStub.createLogger).toHaveBeenCalledOnceWith(loggerName, level.level);
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(matDialogRef.close).not.toHaveBeenCalled();
        expect(component.error).toEqual(error);
      }));
    });
  });
  describe('contains the correct HTML', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['app-log-level-select', 'input[name="name"]'].forEach(selector => {
      it(`with a ${selector}`, () => {
        expect(element.queryAll(By.css(selector)).length).toEqual(1);
      });
    });
    it('if an error occurred', () => {
      expect(element.queryAll(By.css('error-display')).length).toEqual(0);
      
      component.error = error;
      fixture.detectChanges();
      expect(element.queryAll(By.css('error-display')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', function () {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call addLogger when the submit button is clicked', () => {
    spyOn(component, 'addLogger');
    const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
    button.triggerEventHandler('click', null);
    expect(component.addLogger).toHaveBeenCalledWith();
  });
  it('should close the modal when the cancel button is clicked', () => {
    const cancelButton = element.queryAll(By.css('div[mat-dialog-actions] button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
