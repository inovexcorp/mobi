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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { LogFileMetadata, LogPage, LogsManagerService, SearchResponse, TailResponse } from '../../../shared/services/logs-manager.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { ToastService } from '../../../shared/services/toast.service';
import { LogViewerPageComponent } from './log-viewer-page.component';

describe('LogViewerPageComponent', () => {
  let component: LogViewerPageComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<LogViewerPageComponent>;
  let logsManagerStub: jasmine.SpyObj<LogsManagerService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const error = 'Error Message';
  const errorObj: RESTError = {
    error: '',
    errorDetails: [],
    errorMessage: error
  };
  const fileName = 'test.log';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatButtonToggleModule,
        MatCardModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatPaginatorModule,
        MatTooltipModule
      ],
      declarations: [
        LogViewerPageComponent,
        MockComponent(SearchBarComponent),
        MockComponent(ErrorDisplayComponent)
      ],
      providers: [
        MockProvider(LogsManagerService),
        MockProvider(ProgressSpinnerService),
        MockProvider(ToastService)
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(LogViewerPageComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    logsManagerStub = TestBed.inject(LogsManagerService) as jasmine.SpyObj<LogsManagerService>;
    logsManagerStub.getLogFiles.and.returnValue(of([]));
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    logsManagerStub = null;
    progressSpinnerStub = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize properly', () => {
    spyOn(component, 'loadLogFiles');
    component.ngOnInit();
    expect(component.loadLogFiles).toHaveBeenCalledWith();
  });
  describe('component method', () => {
    describe('loadLogFiles should properly retrieve load files and call the appropriate methods', () => {
      beforeEach(() => {
        spyOn(component, 'selectFile');
      });
      it('if the results include karaf.log', fakeAsync(() => {
        const logs = ['karaf.log', 'other.log'];
        logsManagerStub.getLogFiles.and.returnValue(of(logs));
        component.loadLogFiles();
        tick();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(component.error).toBeNull();
        expect(component.selectFile).toHaveBeenCalledWith('karaf.log');
        expect(component.logFiles).toEqual(logs);
        expect(component.loading).toBeFalse();
      }));
      it('if the results do not include karaf.log', fakeAsync(() => {
        const logs = ['other.log', 'another.log'];
        logsManagerStub.getLogFiles.and.returnValue(of(logs));
        component.loadLogFiles();
        tick();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(component.error).toBeNull();
        expect(component.selectFile).toHaveBeenCalledWith('other.log');
        expect(component.logFiles).toEqual(logs);
        expect(component.loading).toBeFalse();
      }));
      it('if the results are empty', fakeAsync(() => {
        const logs = [];
        logsManagerStub.getLogFiles.and.returnValue(of(logs));
        component.loadLogFiles();
        tick();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        expect(component.error).toBeNull();
        expect(component.selectFile).not.toHaveBeenCalled();
        expect(component.logFiles).toEqual(logs);
        expect(component.loading).toBeFalse();
      }));
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.getLogFiles.and.returnValue(throwError(errorObj));
        component.loadLogFiles();
        tick();
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Failed to load log files');
        expect(component.error).toEqual(jasmine.stringContaining(error));
        expect(component.selectFile).not.toHaveBeenCalled();
        expect(component.logFiles).toEqual([]);
        expect(component.loading).toBeFalse();
      }));
    });
    describe('selectFile should properly setup variables for a log file', () => {
      beforeEach(() => {
        spyOn(component, 'loadTail');
        spyOn(component, 'loadPage');
        spyOn(component, 'loadMetadata');
        spyOn(component as any, '_setupAutoRefresh');
        fixture.detectChanges();
        component.selectedFile = 'other.log';
        component.currentPage = 3;
        component.searchTerm = 'previous search';
        component.searchResults = [{
          lineNumber: 1, 
          content: 'test',
          level: ''
        }];
        component.error = 'Previous error';
      });
      it('if on tail view', () => {
        component.selectFile(fileName);
        expect(component.selectedFile).toEqual(fileName);
        expect(component.currentPage).toEqual(0);
        expect(component.searchTerm).toEqual('');
        expect(component.searchResults).toEqual([]);
        expect(component.error).toBeNull();
        expect(component.loadTail).toHaveBeenCalledWith();
        expect(component.loadMetadata).toHaveBeenCalledWith();
        expect(component.loadPage).not.toHaveBeenCalled();
        expect((component as any)._setupAutoRefresh).toHaveBeenCalledWith();
      });
      it('if on paginated view', () => {
        component.viewMode = component.ViewMode.PAGINATED;
        component.selectFile(fileName);
        expect(component.selectedFile).toEqual(fileName);
        expect(component.currentPage).toEqual(0);
        expect(component.searchTerm).toEqual('');
        expect(component.searchResults).toEqual([]);
        expect(component.error).toBeNull();
        expect(component.loadTail).not.toHaveBeenCalled();
        expect(component.loadMetadata).toHaveBeenCalledWith();
        expect(component.loadPage).toHaveBeenCalledWith();
        expect((component as any)._setupAutoRefresh).not.toHaveBeenCalled();
      });
    });
    describe('onFileChange should handle when the selected file changes', () => {
      beforeEach(() => {
        spyOn(component, 'selectFile');
        spyOn(component, 'toggleFileMenu');
      });
      it('unless it did not actually change', () => {
        component.selectedFile = fileName;
        component.onFileChange(fileName);
        expect(component.selectFile).not.toHaveBeenCalled();
        expect(component.toggleFileMenu).toHaveBeenCalledWith();
      });
      it('successfully', () => {
        component.onFileChange(fileName);
        expect(component.selectFile).toHaveBeenCalledWith(fileName);
        expect(component.toggleFileMenu).toHaveBeenCalledWith();
      });
    });
    describe('loadMetadata should load the metadata of the selected file', () => {
      beforeEach(() => {
        progressSpinnerStub.startLoadingForComponent.calls.reset();
        progressSpinnerStub.finishLoadingForComponent.calls.reset();
        component.selectedFile = fileName;
      });
      it('successfully', fakeAsync(() => {
        const metadata: LogFileMetadata = {
          fileName,
          sizeBytes: 0,
          lastModified: 0,
          lineCount: 0
        };
        logsManagerStub.getLogFileMetadata.and.returnValue(of(metadata));
        component.loadMetadata();
        tick();
        expect(logsManagerStub.getLogFileMetadata).toHaveBeenCalledWith(fileName);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.metadata).toEqual(metadata);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless a file is not selected', () => {
        component.selectedFile = null;
        component.loadMetadata();
        expect(logsManagerStub.getLogFileMetadata).not.toHaveBeenCalled();
        expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
      });
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.getLogFileMetadata.and.returnValue(throwError(errorObj));
        component.loadMetadata();
        tick();
        expect(logsManagerStub.getLogFileMetadata).toHaveBeenCalledWith(fileName);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.metadata).toBeNull();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load metadata'));
      }));
    });
    describe('loadPage should load the first page of the selected file', () => {
      beforeEach(() => {
        progressSpinnerStub.startLoadingForComponent.calls.reset();
        progressSpinnerStub.finishLoadingForComponent.calls.reset();
        component.selectedFile = fileName;
      });
      it('successfully', fakeAsync(() => {
        const page: LogPage = {
          fileName,
          lines: [],
          currentPage: 0,
          totalPages: 0,
          totalLines: 0
        };
        logsManagerStub.readLogFile.and.returnValue(of(page));
        component.loadPage();
        tick();
        expect(logsManagerStub.readLogFile).toHaveBeenCalledWith(fileName, component.currentPage, component.pageSize);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.logPage).toEqual(page);
        expect(component.error).toBeNull();
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless a file is not selected', () => {
        component.selectedFile = null;
        component.loadPage();
        expect(logsManagerStub.readLogFile).not.toHaveBeenCalled();
        expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
      });
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.readLogFile.and.returnValue(throwError(errorObj));
        component.loadPage();
        tick();
        expect(logsManagerStub.readLogFile).toHaveBeenCalledWith(fileName, component.currentPage, component.pageSize);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.logPage).toBeNull();
        expect(component.error).toEqual(jasmine.stringContaining(error));
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load log page'));
      }));
    });
    describe('loadTail should load the tail of the selected file', () => {
      beforeEach(() => {
        progressSpinnerStub.startLoadingForComponent.calls.reset();
        progressSpinnerStub.finishLoadingForComponent.calls.reset();
        component.selectedFile = fileName;
      });
      it('successfully', fakeAsync(() => {
        const tail: TailResponse = {
          fileName,
          lines: [],
          count: 0
        };
        logsManagerStub.tailLogFile.and.returnValue(of(tail));
        component.loadTail();
        tick();
        expect(logsManagerStub.tailLogFile).toHaveBeenCalledWith(fileName, component.pageSize);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.tailLines).toEqual(tail.lines);
        expect(component.error).toBeNull();
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless a file is not selected', () => {
        component.selectedFile = null;
        component.loadTail();
        expect(logsManagerStub.tailLogFile).not.toHaveBeenCalled();
        expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
      });
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.tailLogFile.and.returnValue(throwError(errorObj));
        component.loadTail();
        tick();
        expect(logsManagerStub.tailLogFile).toHaveBeenCalledWith(fileName, component.pageSize);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.tailLines).toEqual([]);
        expect(component.error).toEqual(jasmine.stringContaining(error));
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Failed to load tail'));
      }));
    });
    describe('search should search the selected file', () => {
      beforeEach(() => {
        progressSpinnerStub.startLoadingForComponent.calls.reset();
        progressSpinnerStub.finishLoadingForComponent.calls.reset();
        spyOn(component, 'clearSearch');
        spyOn(component, 'setViewMode');
        component.selectedFile = fileName;
        component.searchTerm = 'test';
      });
      it('successfully', fakeAsync(() => {
        const search: SearchResponse = {
          fileName,
          searchTerm: '',
          results: [],
          count: 0
        };
        logsManagerStub.searchLogFile.and.returnValue(of(search));
        component.search();
        tick();
        expect(component.clearSearch).not.toHaveBeenCalled();
        expect(logsManagerStub.searchLogFile).toHaveBeenCalledWith(fileName, component.searchTerm, 500);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.searchResults).toEqual(search.results);
        expect(component.isSearching).toBeFalse();
        expect(component.setViewMode).toHaveBeenCalledWith(component.ViewMode.SEARCH);
        expect(component.error).toBeNull();
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('if the search text is empty', () => {
        component.searchTerm = '';
        component.search();
        expect(component.clearSearch).toHaveBeenCalledWith();
        expect(logsManagerStub.searchLogFile).not.toHaveBeenCalled();
        expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
        expect(component.setViewMode).not.toHaveBeenCalled();
        expect(component.isSearching).toBeFalse();
      });
      it('unless a file is not selected', () => {
        component.selectedFile = null;
        component.search();
        expect(component.clearSearch).not.toHaveBeenCalled();
        expect(logsManagerStub.searchLogFile).not.toHaveBeenCalled();
        expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
        expect(component.setViewMode).not.toHaveBeenCalled();
        expect(component.isSearching).toBeFalse();
      });
      it('unless an error occurs', fakeAsync(() => {
        logsManagerStub.searchLogFile.and.returnValue(throwError(errorObj));
        component.search();
        tick();
        expect(component.clearSearch).not.toHaveBeenCalled();
        expect(logsManagerStub.searchLogFile).toHaveBeenCalledWith(fileName, component.searchTerm, 500);
        expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner, 30);
        expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.targetedSpinner);
        expect(component.searchResults).toEqual([]);
        expect(component.isSearching).toBeFalse();
        expect(component.setViewMode).not.toHaveBeenCalled();
        expect(component.error).toEqual(jasmine.stringContaining(error));
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Search failed'));
      }));
    });
    describe('setViewMode call the proper methods', () => {
      beforeEach(() => {
        spyOn(component, 'loadTail');
        spyOn(component, 'loadPage');
        spyOn(component as any, '_setupAutoRefresh');
        spyOn(component as any, '_stopAutoRefresh');
        component.error = 'Previous error';
      });
      it('when set to TAIL', () => {
        component.setViewMode(component.ViewMode.TAIL);
        expect(component.viewMode).toEqual(component.ViewMode.TAIL);
        expect(component.error).toBeNull();
        expect(component.loadTail).toHaveBeenCalledWith();
        expect(component.loadPage).not.toHaveBeenCalled();
        expect((component as any)._setupAutoRefresh).toHaveBeenCalledWith();
        expect((component as any)._stopAutoRefresh).not.toHaveBeenCalled();
      });
      it('when set to PAGINATED', () => {
        component.setViewMode(component.ViewMode.PAGINATED);
        expect(component.viewMode).toEqual(component.ViewMode.PAGINATED);
        expect(component.error).toBeNull();
        expect(component.loadTail).not.toHaveBeenCalled();
        expect(component.loadPage).toHaveBeenCalledWith();
        expect((component as any)._setupAutoRefresh).not.toHaveBeenCalled();
        expect((component as any)._stopAutoRefresh).toHaveBeenCalledWith();
      });
      it('when set to SEARCH', () => {
        component.setViewMode(component.ViewMode.SEARCH);
        expect(component.viewMode).toEqual(component.ViewMode.SEARCH);
        expect(component.error).toBeNull();
        expect(component.loadTail).not.toHaveBeenCalled();
        expect(component.loadPage).not.toHaveBeenCalled();
        expect((component as any)._setupAutoRefresh).not.toHaveBeenCalled();
        expect((component as any)._stopAutoRefresh).toHaveBeenCalledWith();
      });
    });
    it('onPageChange should handle when a pagination button is clicked', () => {
      spyOn(component, 'loadPage');
      component.onPageChange({ pageIndex: 2, pageSize: 10 } as PageEvent);
      expect(component.currentPage).toEqual(2);
      expect(component.pageSize).toEqual(10);
      expect(component.loadPage).toHaveBeenCalledWith();
    });
    describe('toggleAutoRefresh properly sets the refresh settings', () => {
      beforeEach(() => {
        spyOn(component as any, '_setupAutoRefresh');
        spyOn(component as any, '_stopAutoRefresh');
      });
      it('when being enabled', () => {
        component.autoRefresh = false;
        component.toggleAutoRefresh();
        expect(component.autoRefresh).toBeTrue();
        expect((component as any)._setupAutoRefresh).toHaveBeenCalledWith();
        expect((component as any)._stopAutoRefresh).not.toHaveBeenCalled();
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith('Auto-refresh enabled');
      });
      it('when being disabled', () => {
        component.autoRefresh = true;
        component.toggleAutoRefresh();
        expect(component.autoRefresh).toBeFalse();
        expect((component as any)._setupAutoRefresh).not.toHaveBeenCalled();
        expect((component as any)._stopAutoRefresh).toHaveBeenCalledWith();
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith('Auto-refresh disabled');
      });
    });
    describe('refresh should call the proper method', () => {
      beforeEach(() => {
        spyOn(component, 'loadTail');
        spyOn(component, 'loadPage');
        spyOn(component, 'search');
      });
      it('if in VIEW mode', () => {
        component.refresh();
        expect(component.loadTail).toHaveBeenCalledWith();
        expect(component.loadPage).not.toHaveBeenCalled();
        expect(component.search).not.toHaveBeenCalled();
      });
      it('if in PAGINATED mode', () => {
        component.viewMode = component.ViewMode.PAGINATED;
        component.refresh();
        expect(component.loadTail).not.toHaveBeenCalled();
        expect(component.loadPage).toHaveBeenCalledWith();
        expect(component.search).not.toHaveBeenCalled();
      });
      describe('if in SEARCH mode', () => {
        beforeEach(() => {
          component.viewMode = component.ViewMode.SEARCH;
        });
        it('with no search term', () => {
          component.refresh();
          expect(component.loadTail).not.toHaveBeenCalled();
          expect(component.loadPage).not.toHaveBeenCalled();
          expect(component.search).not.toHaveBeenCalled();
        });
        it('with a search term', () => {
          component.searchTerm = 'test';
          component.refresh();
          expect(component.loadTail).not.toHaveBeenCalled();
          expect(component.loadPage).not.toHaveBeenCalled();
          expect(component.search).toHaveBeenCalledWith();
        });
      });
    });
    describe('getLogLevelClass should return the appropriate CSS class', () => {
      it('for ERROR', () => {
        expect(component.getLogLevelClass('ERROR blah')).toEqual('log-error');
      });
      it('for WARN', () => {
        expect(component.getLogLevelClass('WARN blah')).toEqual('log-warn');
      });
      it('for INFO', () => {
        expect(component.getLogLevelClass('INFO blah')).toEqual('log-info');
      });
      it('for DEBUG', () => {
        expect(component.getLogLevelClass('DEBUG blah')).toEqual('log-debug');
      });
      it('for TRACE', () => {
        expect(component.getLogLevelClass('TRACE blah')).toEqual('log-trace');
      });
      it('for anything else', () => {
        expect(component.getLogLevelClass('blah blah')).toEqual('log-trace');
      });
    });
    it('clearSearch should reset variables properly', () => {
      spyOn(component, 'setViewMode');
      component.searchSubmitted = true;
      component.searchTerm = 'test';
      component.searchResults = [{
        lineNumber: 1, 
        content: 'test',
        level: ''
      }];
      component.clearSearch();
      expect(component.searchSubmitted).toBeFalse();
      expect(component.searchTerm).toEqual('');
      expect(component.searchResults).toEqual([]);
      expect(component.setViewMode).toHaveBeenCalledWith(component.ViewMode.TAIL);
    });
    it('toggleFileMenu should properly open/close the menu', () => {
      fixture.detectChanges();
      spyOn(component.trigger, 'closeMenu');
      spyOn(component.trigger, 'openMenu');
      component.toggleFileMenu();
      expect(component.trigger.openMenu).toHaveBeenCalledWith();
      component.fileMenuOpened = true;
      component.toggleFileMenu();
      expect(component.trigger.closeMenu).toHaveBeenCalledWith();
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.log-viewer-page')).length).toEqual(1);
      expect(element.queryAll(By.css('.content-wrapper')).length).toEqual(1);
      expect(element.queryAll(By.css('.metadata-card')).length).toEqual(1);
      expect(element.queryAll(By.css('.metadata-card .metadata-item')).length).toEqual(4);
    });
    it('if there are no log files', () => {
      expect(element.queryAll(By.css('.empty-state-card .no-files-found')).length).toEqual(1);
    });
    it('if there are log files but none are selected', () => {
      component.logFiles = [fileName, 'other.log'];
      fixture.detectChanges();
      expect(element.queryAll(By.css('.empty-state-card .no-file-selected')).length).toEqual(1);
    });
    it('if file metadata is found', () => {
      component.metadata = {
        fileName,
        sizeBytes: 1024,
        lastModified: Date.now(),
        lineCount: 100
      };
      logsManagerStub.formatTimestamp.and.returnValue(component.metadata.lastModified.toString());
      logsManagerStub.formatFileSize.and.returnValue('1.00 KB');
      fixture.detectChanges();
      const fileTrigger = element.queryAll(By.css('.metadata-card .metadata-item.file-trigger'))[0];
      expect(fileTrigger).toBeTruthy();
      expect(fileTrigger.nativeElement.textContent).toContain(fileName);
      const sizeItem = element.queryAll(By.css('.metadata-card .metadata-item.file-size'))[0];
      expect(sizeItem).toBeTruthy();
      expect(sizeItem.nativeElement.textContent).toContain('1.00 KB');
      const lineCountItem = element.queryAll(By.css('.metadata-card .metadata-item.file-line-count'))[0];
      expect(lineCountItem).toBeTruthy();
      expect(lineCountItem.nativeElement.textContent).toContain(component.metadata.lineCount);
      const modifiedItem = element.queryAll(By.css('.metadata-card .metadata-item.file-last-modified'))[0];
      expect(modifiedItem).toBeTruthy();
      expect(modifiedItem.nativeElement.textContent).toContain(component.metadata.lastModified.toString());
    });
    describe('if a file is selected', () => {
      beforeEach(() => {
        component.selectedFile = fileName;
      });
      it('with appropriate controls', () => {
        fixture.detectChanges();
        expect(element.queryAll(By.css('.controls-header .search-container')).length).toEqual(1);
        expect(element.queryAll(By.css('.controls-header .button-toggle-container')).length).toEqual(1);
        expect(element.queryAll(By.css('.controls-header .refresh-button-container')).length).toEqual(1);
      });
      describe('in TAIL mode', () => {
        const tail: TailResponse = {
          fileName,
          lines: ['ERROR Line 1', 'INFO Line 2', ' WARN Line 3'],
          count: 3
        };
        beforeEach(() => {
          component.viewMode = component.ViewMode.TAIL;
          component.tailLines = tail.lines;
          fixture.detectChanges();
        });
        describe('with the appropriate auto refresh state', () => {
          it('with button enabled', () => {
            const button = element.queryAll(By.css('.refresh-button-container button.auto-refresh-button'))[0];
            expect(button).toBeTruthy();
            expect(button.nativeElement.disabled).toBeFalse();
          });
          it('when auto refresh is disabled', () => {
            const icon = element.queryAll(By.css('.refresh-button-container button.auto-refresh-button mat-icon'))[0];
            expect(icon).toBeTruthy();
            expect(icon.nativeElement.textContent).toContain('play_arrow');
            expect(element.queryAll(By.css('.selected-file-card .status-text .paused-indicator')).length).toEqual(1);
          });
          it('when auto refresh is disabled', () => {
            component.autoRefresh = true;
            fixture.detectChanges();
            const icon = element.queryAll(By.css('.refresh-button-container button.auto-refresh-button mat-icon'))[0];
            expect(icon).toBeTruthy();
            expect(icon.nativeElement.textContent).toContain('pause');
            expect(element.queryAll(By.css('.selected-file-card .status-text .refresh-indicator')).length).toEqual(1);
          });
        });
        it('with tail lines displayed', () => {
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line')).length).toEqual(tail.lines.length);
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line.log-error')).length).toEqual(1);
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line.log-info')).length).toEqual(1);
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line.log-warn')).length).toEqual(1);
        });
      });
      describe('in PAGINATED mode', () => {
        const page: LogPage = {
          fileName,
          lines: ['ERROR Line 1', 'INFO Line 2', ' WARN Line 3'],
          currentPage: 0,
          totalPages: 1,
          totalLines: 3
        };
        beforeEach(() => {
          component.viewMode = component.ViewMode.PAGINATED;
          component.logPage = page;
          fixture.detectChanges();
        });
        describe('with the appropriate auto refresh state', () => {
          it('with button disabled', () => {
            const button = element.queryAll(By.css('.refresh-button-container button.auto-refresh-button'))[0];
            expect(button).toBeTruthy();
            expect(button.nativeElement.disabled).toBeTrue();
          });
        });
        it('with page lines displayed', () => {
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line')).length).toEqual(page.lines.length);
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line.log-error')).length).toEqual(1);
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line.log-info')).length).toEqual(1);
          expect(element.queryAll(By.css('.selected-file-card .log-output .log-line.log-warn')).length).toEqual(1);
        });
        it('with a mat-paginator', () => {
          expect(element.queryAll(By.css('.selected-file-card mat-paginator')).length).toEqual(1);
        });
      });
      describe('in SEARCH mode', () => {
        const search: SearchResponse = {
          fileName,
          searchTerm: 'Line',
          results: [{ lineNumber: 1, content: 'ERROR Line 1', level: 'ERROR' },
                    { lineNumber: 2, content: 'INFO Line 2', level: 'INFO' },
                    { lineNumber: 3, content: ' WARN Line 3', level: 'WARN' }],
          count: 3
        };
        beforeEach(() => {
          component.viewMode = component.ViewMode.SEARCH;
          component.searchTerm = search.searchTerm;
          component.searchResults = search.results;
          fixture.detectChanges();
        });
        describe('with the appropriate auto refresh state', () => {
          it('with button disabled', () => {
            const button = element.queryAll(By.css('.refresh-button-container button.auto-refresh-button'))[0];
            expect(button).toBeTruthy();
            expect(button.nativeElement.disabled).toBeTrue();
          });
        });
        it('with search results displayed', () => {
          expect(element.queryAll(By.css('.selected-file-card .search-results-list .search-result-item')).length).toEqual(search.results.length);
          expect(element.queryAll(By.css('.selected-file-card .search-results-list .search-result-item .log-line.log-error')).length).toEqual(1);
          expect(element.queryAll(By.css('.selected-file-card .search-results-list .search-result-item .log-line.log-info')).length).toEqual(1);
          expect(element.queryAll(By.css('.selected-file-card .search-results-list .search-result-item .log-line.log-warn')).length).toEqual(1);
        });
        it('with a .status-text', () => {
          expect(element.queryAll(By.css('.selected-file-card .status-text')).length).toEqual(1);
        });
      });
    });
  });
});
