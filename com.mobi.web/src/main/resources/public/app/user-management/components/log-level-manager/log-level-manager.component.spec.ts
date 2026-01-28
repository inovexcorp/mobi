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
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { AddLoggerModalComponent } from '../add-logger-modal/add-logger-modal.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { LogLevelInfoModalComponent } from '../log-level-info-modal/log-level-info-modal.component';
import { LogLevelSelectComponent } from '../log-level-select/log-level-select.component';
import { LogsManagerService } from '../../../shared/services/logs-manager.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { ToastService } from '../../../shared/services/toast.service';
import { LogLevelManagerComponent, LogLevelOption } from './log-level-manager.component';

describe('LogLevelManagerComponent', () => {
  let component: LogLevelManagerComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<LogLevelManagerComponent>;
  let logsManagerStub: jasmine.SpyObj<LogsManagerService>;
  let dialogStub: jasmine.SpyObj<MatDialog>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

  const error: RESTError = {
    error: 'Error',
    errorMessage: 'Error Message',
    errorDetails: []
  };
  const availableLevels: LogLevelOption[] = [
    { level: 'DEBUG', icon: 'bug_report' },
    { level: 'INFO', icon: 'info' },
    { level: 'WARN', icon: 'warning' },
    { level: 'ERROR', icon: 'error' }
  ];
  const loggers: {[key: string]: string} = {
    'com.mobi.web': 'DEBUG',
    'org.springframework': 'INFO',
    'ROOT': 'WARN'
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule
      ],
      declarations: [
        LogLevelManagerComponent,
        MockComponent(AddLoggerModalComponent),
        MockComponent(LogLevelInfoModalComponent),
        MockComponent(LogLevelSelectComponent),
        MockComponent(SearchBarComponent)
      ],
      providers: [
        MockProvider(LogsManagerService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => of(true) }
          })
        },
        MockProvider(ProgressSpinnerService),
        MockProvider(ToastService)
      ]
    }).compileComponents();

    logsManagerStub = TestBed.inject(LogsManagerService) as jasmine.SpyObj<LogsManagerService>;
    logsManagerStub.getAvailableLevels.and.returnValue(of(availableLevels.map(level => level.level)));
    logsManagerStub.getAllLoggers.and.returnValue(of(loggers));
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    dialogStub = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(LogLevelManagerComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    logsManagerStub = null;
    dialogStub = null;
    progressSpinnerStub = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should initialize properly', () => {
    beforeEach(() => {
      spyOn(component, 'loadLoggers');
    });
    it('with available levels', fakeAsync(() => {
      spyOn(component, 'loadAvailableLevels').and.returnValue(of(null));
      component.ngOnInit();
      tick();
      expect(component.loadAvailableLevels).toHaveBeenCalledWith();
      expect(component.loadLoggers).toHaveBeenCalledWith();
      expect(toastStub.createErrorToast).not.toHaveBeenCalled();
    }));
    it('unless an error occurs', fakeAsync(() => {
      spyOn(component, 'loadAvailableLevels').and.returnValue(throwError(error));
      component.ngOnInit();
      tick();
      expect(component.loadAvailableLevels).toHaveBeenCalledWith();
      expect(component.loadLoggers).not.toHaveBeenCalledWith();
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining(error.errorMessage));
    }));
  });
  describe('component method', () => {
    it('loadAvailableLevels should fetch the available levels', fakeAsync(() => {
      spyOn(component, 'getLevelIcon').and.callThrough();
      component.loadAvailableLevels().subscribe(() => {
        expect(component.availableLevels).toEqual(availableLevels);
        expect(component.getLevelIcon).toHaveBeenCalledTimes(availableLevels.length);
      });
      tick();
      expect(logsManagerStub.getAvailableLevels).toHaveBeenCalledWith(true);
    }));
    describe('loadLoggers should fetch all the configured loggers', () => {
      beforeEach(() => {
        component.dataSource.data = [];
      });
      it('successfully', fakeAsync(() => {
        component.loadLoggers();
        tick();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.tableContainer, 40);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.tableContainer);
        expect(logsManagerStub.getAllLoggers).toHaveBeenCalledWith(true);
        expect(component.dataSource.data).toEqual([
          {
            name: 'ROOT',
            level: availableLevels.find(opt => opt.level === 'WARN'),
            isRoot: true
          },
          {
            name: 'com.mobi.web',
            level: availableLevels.find(opt => opt.level === 'DEBUG'),
            isRoot: false
          },
          {
            name: 'org.springframework',
            level: availableLevels.find(opt => opt.level === 'INFO'),
            isRoot: false
          }
        ]);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.getAllLoggers.and.returnValue(throwError(error));
        component.loadLoggers();
        tick();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.tableContainer, 40);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.tableContainer);
        expect(logsManagerStub.getAllLoggers).toHaveBeenCalledWith(true);
        expect(component.dataSource.data).toEqual([]);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining(error.errorMessage));
      }));
    });
    describe('updateLoggerLevel should update the level of a logger', () => {
      const level = availableLevels[2];
      beforeEach(() => {
        spyOn(component, 'loadLoggers');
      });
      it('successfully', fakeAsync(() => {
        logsManagerStub.setLoggerLevel.and.returnValue(of({ loggerName: 'com.mobi.test', level: level.level }));
        component.updateLoggerLevel('com.mobi.test', level);
        tick();
        expect(logsManagerStub.setLoggerLevel).toHaveBeenCalledOnceWith('com.mobi.test', level.level);
        expect(component.loadLoggers).toHaveBeenCalledWith();
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.stringContaining('com.mobi.test'));
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.setLoggerLevel.and.returnValue(throwError(error));
        component.updateLoggerLevel('com.mobi.test', level);
        tick();
        expect(logsManagerStub.setLoggerLevel).toHaveBeenCalledOnceWith('com.mobi.test', level.level);
        expect(component.loadLoggers).not.toHaveBeenCalled();
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining(error.errorMessage));
      }));
    });
    it('confirmDeleteLogger should confirm deletion of a logger', fakeAsync(function () {
      spyOn(component, 'deleteLogger');
      component.confirmDeleteLogger('com.mobi.test');
      tick();
      expect(dialogStub.open).toHaveBeenCalledWith(ConfirmModalComponent, { data: { content: jasmine.stringMatching('Are you sure you want to delete') } });
      expect(component.deleteLogger).toHaveBeenCalledWith('com.mobi.test');
    }));
    describe('deleteLogger should delete a logger', () => {
      beforeEach(() => {
        spyOn(component, 'loadLoggers');
      });
      it('successfully', fakeAsync(() => {
        logsManagerStub.deleteLogger.and.returnValue(of(undefined));
        component.deleteLogger('com.mobi.test');
        tick();
        expect(logsManagerStub.deleteLogger).toHaveBeenCalledOnceWith('com.mobi.test');
        expect(component.loadLoggers).toHaveBeenCalledWith();
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.stringContaining('com.mobi.test'));
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.deleteLogger.and.returnValue(throwError(error));
        component.deleteLogger('com.mobi.test');
        tick();
        expect(logsManagerStub.deleteLogger).toHaveBeenCalledOnceWith('com.mobi.test');
        expect(component.loadLoggers).not.toHaveBeenCalled();
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining(error.errorMessage));
      }));
    });
    it('openAddModal should open the modal to add a logger', fakeAsync(() => {
      spyOn(component, 'loadLoggers');
      component.openAddModal();
      tick();
      expect(dialogStub.open).toHaveBeenCalledWith(AddLoggerModalComponent, { data: { availableLevels } });
      expect(component.loadLoggers).toHaveBeenCalledWith();
    }));
    it('applyFilter should filter the logger datasource', () => {
      component.filterValue = 'testFilter';
      component.applyFilter();
      expect(component.dataSource.filter).toEqual(component.filterValue.trim().toLowerCase());
    });
    it('getLevelIcon should return the icon for a log level', () => {
      availableLevels.forEach(level => {
        const icon = component.getLevelIcon(level.level);
        expect(icon).toEqual(level.icon);
      });
      const unknownIcon = component.getLevelIcon('UNKNOWN_LEVEL');
      expect(unknownIcon).toEqual('label');
    });
    it('openHelpModal should open the help modal', () => {
      component.openHelpModal();
      expect(dialogStub.open).toHaveBeenCalledWith(LogLevelInfoModalComponent);
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.log-level-manager')).length).toEqual(1);
      expect(element.queryAll(By.css('.table-header-section')).length).toEqual(1);
      expect(element.queryAll(By.css('.table-container')).length).toEqual(1);
    });
    ['search-bar', 'table', 'button.info-button', 'button.add-logger-button', 'button.refresh-button'].forEach(selector => {
      it(`with a ${selector}`, () => {
        expect(element.queryAll(By.css(selector)).length).toEqual(1);
      });
    });
    it('with a table header', () => {
      expect(element.queryAll(By.css('table.mat-table')).length).toEqual(1);
      expect(element.queryAll(By.css('table.mat-table th')).length).toEqual(3);
      const columnHeaders = ['Logger Name', 'Log Level', 'Actions'];
      expect(element.queryAll(By.css('table.mat-table th')).map((debugElement) => debugElement.nativeElement.innerText)).toEqual(columnHeaders);
    });
    it('with table rows', () => {
      const loggerNames = ['ROOT'].concat(Object.keys(loggers).filter(name => name !== 'ROOT').sort());
      expect(element.queryAll(By.css('table.mat-table')).length).toEqual(1);
      expect(element.queryAll(By.css('table tbody tr.mat-row')).length).toEqual(loggerNames.length);
      expect(element.queryAll(By.css('table tbody app-log-level-select')).length).toEqual(loggerNames.length);
      expect(element.queryAll(By.css('table tbody button.delete-logger-button')).length).toEqual(loggerNames.length);
      loggerNames.forEach((loggerName, index) => {
        expect(element.query(By.css(`table tbody tr:nth-child(${index + 1}) td:nth-child(1)`)).nativeElement.innerText).toContain(loggerName);
      });
    });
  });
  it('should open the modal to add a logger on button click', () => {
    spyOn(component, 'openAddModal');
    const button = element.query(By.css('button.add-logger-button'));
    button.triggerEventHandler('click', null);
    expect(component.openAddModal).toHaveBeenCalledWith();
  });
  it('should refresh the loggers on button click', () => {
    spyOn(component, 'loadLoggers');
    const button = element.query(By.css('button.refresh-button'));
    button.triggerEventHandler('click', null);
    expect(component.loadLoggers).toHaveBeenCalledWith();
  });
  it('should open the help modal on button click', () => {
    spyOn(component, 'openHelpModal');
    const button = element.query(By.css('button.info-button'));
    button.triggerEventHandler('click', null);
    expect(component.openHelpModal).toHaveBeenCalledWith();
  });
});