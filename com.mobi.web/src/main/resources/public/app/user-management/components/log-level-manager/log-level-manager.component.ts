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
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';

import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import { AddLoggerModalComponent } from '../add-logger-modal/add-logger-modal.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { LogLevelInfoModalComponent } from '../log-level-info-modal/log-level-info-modal.component';
import { LogLevelResponse, LogsManagerService } from '../../../shared/services/logs-manager.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ToastService } from '../../../shared/services/toast.service';

export interface LoggerRow {
  name: string;
  level: { level: string, icon: string };
  isRoot: boolean;
}

export interface LogLevelOption {
  level: string,
  icon: string
}

/**
 * @class LogLevelManagerComponent
 * 
 * A component for managing log levels of different packages and the root logger. Contains a searchable table
 * displaying current loggers and their levels, with options to add, update, and delete loggers.
 */
@Component({
  selector: 'app-log-level-manager',
  templateUrl: './log-level-manager.component.html',
  styleUrls: ['./log-level-manager.component.scss']
})
export class LogLevelManagerComponent {
  @ViewChild('tableContainer', { static: true }) tableContainer: ElementRef;
  
  displayedColumns: string[] = ['name', 'level', 'actions'];
  dataSource = new MatTableDataSource<LoggerRow>([]);

  availableLevels: LogLevelOption[] = [];
  loading = false;
  filterValue = '';

  constructor(
    private _lm: LogsManagerService,
    private _dialog: MatDialog,
    private _toast: ToastService,
    private _spinnerSvc: ProgressSpinnerService
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (data: LoggerRow, filter: string) => {
      const searchString = filter.trim().toLowerCase();
      return data.name.trim().toLowerCase().includes(searchString);
    };

    this.loadAvailableLevels().subscribe(() => {
      this.loadLoggers();
    }, (err: RESTError) => {
      this._toast.createErrorToast(`Failed to load available log levels: ${err.errorMessage}`);
    });
  }

  /**
   * Loads the available log levels using the {@link LogsManagerService}. On success, populates the
   * `availableLevels` property.
   * 
   * @returns {Observable<void>} An observable that completes when the levels are loaded
   */
  loadAvailableLevels(): Observable<void> {
    return this._lm.getAvailableLevels(true).pipe(map(levels => {
        this.availableLevels = levels.map(level => ({
          level,
          icon: this.getLevelIcon(level)
        }));
      })
    );
  }

  /**
   * Loads all configured loggers using the {@link LogsManagerService}. On success, populates the table data source.
   */
  loadLoggers(): void {
    this.loading = true;
    
    this._spinnerSvc.startLoadingForComponent(this.tableContainer, 40);
    this._lm.getAllLoggers(true).pipe(finalize(() => {
      this._spinnerSvc.finishLoadingForComponent(this.tableContainer);
      this.loading = false;
    })).subscribe({
      next: (loggers) => {
        const rows: LoggerRow[] = [];
        
        for (const [name, level] of Object.entries(loggers)) {
          rows.push({
            name,
            level: this.availableLevels.find(opt => opt.level === level),
            isRoot: name === 'ROOT'
          });
        }
        
        // Sort with ROOT first, then alphabetically
        rows.sort((a, b) => {
          if (a.isRoot) {
            return -1;
          }
          if (b.isRoot) {
            return 1;
          }
          return a.name.localeCompare(b.name);
        });
        
        this.dataSource.data = rows;
      },
      error: (err: RESTError) => {
        this._toast.createErrorToast(`Failed to load loggers: ${err.errorMessage}`);
      }
    });
  }

  /**
   * Updates the level of a logger using the {@link LogsManagerService}. On success, reloads the loggers.
   * 
   * @param {string} loggerName The name of the logger to update
   * @param {LogLevelOption} newLevel The new log level
   */
  updateLoggerLevel(loggerName: string, newLevel: LogLevelOption): void {
    this._lm.setLoggerLevel(loggerName, newLevel.level).subscribe({
      next: (response: LogLevelResponse) => {
        this._toast.createSuccessToast(`Successfully updated logger ${loggerName} to level ${response.level}`);
        this.loadLoggers();
      },
      error: (err: RESTError) => {
        this._toast.createErrorToast(`Failed to update logger level for ${loggerName}: ${err.errorMessage}`);
      }
    });
  }

  /**
   * Opens a {@link ConfirmModalComponent} to confirm deletion of a logger. Will not allow deletion of the ROOT logger.
   * 
   * @param {string} loggerName The name of the logger to delete
   */
  confirmDeleteLogger(loggerName: string): void {
    if (loggerName === 'ROOT') {
      console.error('Cannot delete ROOT logger', 'warning');
      return;
    }

    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to delete the <strong>${loggerName}</strong> logger?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.deleteLogger(loggerName);
      }
    });
  }

  /**
   * Called the {@link LogsManagerService} to delete a logger. Reloads the loggers list on success.
   * 
   * @param {string} loggerName The name of the logger to delete
   */
  deleteLogger(loggerName: string): void {
    this._lm.deleteLogger(loggerName).subscribe({
      next: () => {
        this._toast.createSuccessToast(`Successfully deleted logger ${loggerName}`);
        this.loadLoggers();
      },
      error: (err: RESTError) => {
        this._toast.createErrorToast(`Failed to delete logger ${loggerName}: ${err.errorMessage}`);
      }
    });
  }

  /**
   * Opens the {@link AddLoggerModalComponent} to add a new logger, passing the list of available log levels. If a
   * logger was added, indicated by the modal result being true, then reloads the loggers.
   */
  openAddModal() {
    this._dialog.open(AddLoggerModalComponent, {
      data: { availableLevels: this.availableLevels }}
    ).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.loadLoggers();
      }
    });
  }

  /**
   * Applies the text filter to table of log levels.
   */
  applyFilter(): void {
    this.dataSource.filter = this.filterValue.trim().toLowerCase();
  }

  /**
   * Get the Material Icon name for the provided log level.
   * 
   * @param {string} level The log level in question
   * @returns {string} The name of a Material Icon
   */
  getLevelIcon(level: string): string {
    switch (level) {
      case 'ERROR':
      case 'OFF':
        return 'error';
      case 'WARN':
        return 'warning';
      case 'INFO':
        return 'info';
      case 'DEBUG':
        return 'bug_report';
      case 'TRACE':
        return 'timeline';
      default:
        return 'label';
    }
  }

  /**
   * Opens the {@link LogLevelInfoModalComponent}.
   */
  openHelpModal(): void {
    this._dialog.open(LogLevelInfoModalComponent);
  }
}
