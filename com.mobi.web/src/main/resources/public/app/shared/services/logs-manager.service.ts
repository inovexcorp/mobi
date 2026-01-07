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
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { handleErrorObject } from '../utility';
import { REST_PREFIX } from '../../constants';

// TODO decide whether to move these out of here
export interface LogPage {
  lines: string[];
  currentPage: number;
  totalPages: number;
  totalLines: number;
  fileName: string;
}

export interface LogEntry {
  lineNumber: number;
  content: string;
  level: string;
  timestamp?: string;
}

export interface LogFileMetadata {
  fileName: string;
  sizeBytes: number;
  lastModified: number;
  lineCount: number;
}

export interface SearchResponse {
  fileName: string;
  searchTerm: string;
  results: LogEntry[];
  count: number;
}

export interface TailResponse {
  fileName: string;
  lines: string[];
  count: number;
}

/**
 * @class LogViewerService
 * 
 * A service that provides access to the Mobi /logs REST endpoints.
*/
@Injectable({
  providedIn: 'root'
})
export class LogsManagerService {
  readonly prefix = `${REST_PREFIX}logs`;
  
  constructor(private _http: HttpClient) {}
  
  /**
   * Get list of available log files
   * 
   * @returns {Observable<string[]>} An observable emitting an array of log file names
   */
  getLogFiles(): Observable<string[]> {
    return this._http.get<string[]>(`${this.prefix}/files`)
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Get metadata for a specific log file
   * 
   * @param {string} fileName The name of the file to retrieve metadata for
   * @returns {Observable<LogFileMetadata>} An observable emitting the metadata about the particular log file
   */
  getLogFileMetadata(fileName: string): Observable<LogFileMetadata> {
    return this._http.get<LogFileMetadata>(`${this.prefix}/files/${encodeURIComponent(fileName)}/metadata`)
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Read log file with pagination
   * 
   * @param {string} fileName The name of the file to read
   * @param {number} [page=0] The page number to retrieve (0-based)
   * @param {number} [pageSize=0] The number of lines per page
   * @returns {Observable<LogPage>} An observable emitting a page of log file lines
   */
  readLogFile(fileName: string, page = 0, pageSize = 100): Observable<LogPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this._http.get<LogPage>(`${this.prefix}/files/${encodeURIComponent(fileName)}`, { params })
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Get tail of log file (most recent entries)
   * 
   * @param {string} fileName The name of the file to read
   * @param {number} [lines=100] The number of lines to retrieve
   */
  tailLogFile(fileName: string, lines = 100): Observable<TailResponse> {
    const params = new HttpParams().set('lines', lines.toString());
    return this._http.get<TailResponse>(`${this.prefix}/files/${encodeURIComponent(fileName)}/tail`, { params })
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Search log file for a term
   * 
   * @param {string} fileName The name of the file to search
   * @param {string} searchTerm The term to search for
   * @param {number} [maxResults=100] The maximum number of results to return
   * @returns {Observable<SearchResponse>} An observable emitting the search results
   */
  searchLogFile(fileName: string, searchTerm: string, maxResults = 100): Observable<SearchResponse> {
    const params = new HttpParams()
      .set('term', searchTerm)
      .set('maxResults', maxResults.toString());

    return this._http.get<SearchResponse>(`${this.prefix}/files/${encodeURIComponent(fileName)}/search`, { params })
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Calls the GET /mobirest/logs/files/{fileName} endpoint using the `window.open` method which will
   * start a download of the identified log file.
   * 
   * @param {string} fileName The name of the file to download
   */
  downloadLogFile(fileName: string): void {
    const url = `${this.prefix}/files/${encodeURIComponent(fileName)}`;
    window.open(url);
  }

  /**
   * Format file size for display
   * 
   * @param {number} bytes A file's size in bytes to be formatted
   * @returns {string} A formatted string representing the file size in the largest unit that makes sense
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format timestamp for display
   * 
   * @param {number} timestamp A timestamp in milliseconds since epoch
   * @returns {string} A formatted date/time string
   */
  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
}
