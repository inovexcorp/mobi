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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatPaginator, PageEvent } from '@angular/material/paginator';

import { interval, Subject } from 'rxjs';
import { finalize, switchMap, takeUntil } from 'rxjs/operators';

import { LogEntry, LogFileMetadata, LogPage, LogsManagerService, SearchResponse, TailResponse } from '../../../shared/services/logs-manager.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ToastService } from '../../../shared/services/toast.service';

enum ViewMode {
  TAIL = 0,
  PAGINATED = 1,
  SEARCH = 2
}

/**
 * @class LogViewerPageComponent
 * 
 * A component that create a page for viewing log files. It allows users to select log files, view their contents in different modes
 * (tail, paginated, search), and see metadata about the selected log file.
 */
@Component({
  selector: 'app-log-viewer-page',
  templateUrl: './log-viewer-page.component.html',
  styleUrls: ['./log-viewer-page.component.scss']
})
export class LogViewerPageComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @ViewChild('targetedSpinner', { static: true }) targetedSpinner: ElementRef;

  public ViewMode = ViewMode;

  fileMenuOpened = false;

  logFiles: string[] = [];
  selectedFile: string | null = null;
  logPage: LogPage | null = null;
  metadata: LogFileMetadata | null = null;
  
  // Pagination
  currentPage = 0;
  pageSize = 100;
  pageSizeOptions: number[] = [50, 100, 200, 500];
  
  // Search
  searchTerm = '';
  searchResults: LogEntry[] = [];
  isSearching = false;
  searchSubmitted = false;
  
  // View mode
  viewMode: ViewMode = ViewMode.TAIL;
  tailLines: string[] = [];
  
  // Auto-refresh
  autoRefresh = false;
  refreshInterval = 5000; // 5 seconds
  private destroy$ = new Subject<void>();
  
  // UI state
  loading = false;
  error: string | null = null;

  constructor(
    public lv: LogsManagerService,
    private _toast: ToastService,
    private _spinner: ProgressSpinnerService
  ) {}

  ngOnInit(): void {
    this.loadLogFiles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load available log files
   */
  loadLogFiles(): void {
    this.loading = true;
    this.error = null;

    this._spinner.startLoadingForComponent(this.targetedSpinner, 30);
    this.lv.getLogFiles().pipe(
      finalize(() => {
        this.loading = false;
        this._spinner.finishLoadingForComponent(this.targetedSpinner);
      })
    ).subscribe({
      next: (files) => {
        this.logFiles = files;
        
        // Auto-select karaf.log if available
        if (files.includes('karaf.log')) {
          this.selectFile('karaf.log');
        } else if (files.length > 0) {
          this.selectFile(files[0]);
        }
      },
      error: (err: RESTError) => {
        this.error = `Failed to load log files: ${err.errorMessage}`;
        this._toast.createErrorToast('Failed to load log files');
      }
    });
  }

  /**
   * Select a log file to view
   * 
   * @param {string} fileName The name of the file that was selected
   */
  selectFile(fileName: string): void {
    this.selectedFile = fileName;
    this.currentPage = 0;
    this.searchTerm = '';
    this.searchResults = [];
    this.error = null;
    
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    
    // Load metadata
    this.loadMetadata();
    
    // Load content based on view mode
    if (this.viewMode === ViewMode.TAIL) {
      this.loadTail();
      this._setupAutoRefresh();
    } else if (this.viewMode === ViewMode.PAGINATED) {
      this.loadPage();
    } else {
      this.setViewMode(ViewMode.TAIL);
    }
  }

  /**
   * Handle file selection change
   * 
   * @param {string} filename The name of the newly selected file
   */
  onFileChange(filename: string): void {
    // Only run the selectFile method if the file has changed
    if (filename !== this.selectedFile) {
      this.selectFile(filename);
    }
    this.toggleFileMenu();
  }

  /**
   * Load metadata for selected file
   */
  loadMetadata(): void {
    if (!this.selectedFile) {
      return;
    }

    this._spinner.startLoadingForComponent(this.targetedSpinner, 30);
    this.lv.getLogFileMetadata(this.selectedFile).pipe(
      finalize(() => {
        this._spinner.finishLoadingForComponent(this.targetedSpinner);
      })
    ).subscribe({
      next: (metadata) => {
        this.metadata = metadata;
      },
      error: (err: RESTError) => {
        this._toast.createErrorToast(`Failed to load metadata: ${err.errorMessage}`);
      }
    });
  }

  /**
   * Load paginated view
   */
  loadPage(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    this.error = null;

    this._spinner.startLoadingForComponent(this.targetedSpinner, 30);
    this.lv.readLogFile(this.selectedFile, this.currentPage, this.pageSize).pipe(
      finalize(() => {
        this.loading = false;
        this._spinner.finishLoadingForComponent(this.targetedSpinner);
      })
    ).subscribe({
      next: (page) => {
        this.logPage = page;
      },
      error: (err: RESTError) => {
        this.error = `Failed to load log page: ${err.errorMessage}`;
        this._toast.createErrorToast('Failed to load log page');
      }
    });
  }

  /**
   * Load tail view (most recent entries)
   */
  loadTail(): void {
    if (!this.selectedFile) {
      return;
    }

    this.loading = true;
    this.error = null;

    this._spinner.startLoadingForComponent(this.targetedSpinner, 30);
    this.lv.tailLogFile(this.selectedFile, this.pageSize).pipe(
      finalize(() => {
        this.loading = false;
        this._spinner.finishLoadingForComponent(this.targetedSpinner);
      })
    ).subscribe({
      next: (response: TailResponse) => {
        this.tailLines = response.lines;
      },
      error: (err: RESTError) => {
        this.error = `Failed to load tail: ${err.errorMessage}`;
        this._toast.createErrorToast('Failed to load tail');
      }
    });
  }

  /**
   * Search log file
   */
  search(): void {
    if (!this.selectedFile) {
      return;
    }
    if (!this.searchTerm.trim()) {
      this.clearSearch();
      return;
    }

    this.searchSubmitted = true;
    this.isSearching = true;
    this.error = null;

    this._spinner.startLoadingForComponent(this.targetedSpinner, 30);
    this.lv.searchLogFile(this.selectedFile, this.searchTerm, 500).pipe(
      finalize(() => {
        this.isSearching = false;
        this._spinner.finishLoadingForComponent(this.targetedSpinner);
      })
    ).subscribe({
      next: (response: SearchResponse) => {
        this.searchResults = response.results;
        this.setViewMode(ViewMode.SEARCH);
      },
      error: (err: RESTError) => {
        this.error = `Search failed: ${err.errorMessage}`;
        this._toast.createErrorToast('Search failed');
      }
    });
  }

  /**
   * Change view mode
   * 
   * @param {number} mode The index of the view mode in the tab group
   */
  setViewMode(mode: number): void {
    this.viewMode = mode;
    this.error = null;
    
    if (mode === ViewMode.TAIL) {
      this.loadTail();
      this._setupAutoRefresh();
    } else if (mode === ViewMode.PAGINATED) {
      this._stopAutoRefresh();
      this.loadPage();
    } else {
      this._stopAutoRefresh();
    }
  }

  /**
   * Handle page change from Material paginator
   * 
   * @param {PageEvent} event The event from the MatPaginator
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPage();
  }

  /**
   * Toggle auto-refresh for tail view. Updates the value of autoRefresh.
   */
  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this._setupAutoRefresh();
      this._toast.createSuccessToast('Auto-refresh enabled');
    } else {
      this._stopAutoRefresh();
      this._toast.createSuccessToast('Auto-refresh disabled');
    }
  }

  /**
   * Refresh current view
   */
  refresh(): void {
    if (this.viewMode === ViewMode.TAIL) {
      this.loadTail();
    } else if (this.viewMode === ViewMode.PAGINATED) {
      this.loadPage();
    } else if (this.viewMode === ViewMode.SEARCH && this.searchTerm) {
      this.search();
    }
  }

  /**
   * Get log level class for styling
   * 
   * @param {string} line A line from the logs
   * @returns {string} The CSS class corresponding to the log level
   */
  getLogLevelClass(line: string): string {
    if (line.includes('ERROR')) {
      return 'log-error';
    }
    if (line.includes('WARN')) {
      return 'log-warn';
    }
    if (line.includes('INFO')) {
      return 'log-info';
    }
    if (line.includes('DEBUG')) {
      return 'log-debug';
    }
    return 'log-trace';
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchSubmitted = false;
    this.searchTerm = '';
    this.searchResults = [];
    this.setViewMode(ViewMode.TAIL);
  }

  /**
   * Toggles the visibility of the file selection menu.
   */
  toggleFileMenu(): void {
    this.fileMenuOpened ? this.trigger.closeMenu() : this.trigger.openMenu();
  }

  /**
   * Download current log file
   */
  downloadLogFile(): void {
    if (this.selectedFile) {
      this.lv.downloadLogFile(this.selectedFile);
    }
  }

  /**
   * Setup auto-refresh interval
   */
  private _setupAutoRefresh(): void {
    this._stopAutoRefresh(); // Clear any existing interval
    
    if (this.autoRefresh && this.viewMode === ViewMode.TAIL) {
      interval(this.refreshInterval)
        .pipe(
          takeUntil(this.destroy$),
          switchMap(() => {
            if (this.selectedFile) {
              return this.lv.tailLogFile(this.selectedFile, this.pageSize);
            }
            return [];
          })
        )
        .subscribe({
          next: (response: TailResponse) => {
            this.tailLines = response.lines;
          },
          error: (err) => {
            console.error('Auto-refresh failed:', err);
          }
        });
    }
  }

  /**
   * Stop auto-refresh
   */
  private _stopAutoRefresh(): void {
    this.destroy$.next();
  }
}
