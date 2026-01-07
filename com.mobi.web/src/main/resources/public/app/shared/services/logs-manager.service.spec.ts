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
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { RESTError } from '../models/RESTError.interface';
import { LogFileMetadata, LogPage, LogsManagerService, SearchResponse, TailResponse } from './logs-manager.service';

describe('Logs Manager Service', () => {
  let service: LogsManagerService;
  let httpMock: HttpTestingController;

  const error = 'Error Message';
  const errorObj: RESTError = {
    error: '',
    errorDetails: [],
    errorMessage: error
  };
  const fileName = 'file1.log';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LogsManagerService],
    });
    service = TestBed.inject(LogsManagerService);
    httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
  });

  afterEach(function() {
    cleanStylesFromDOM();
    service = null;
    httpMock = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('getLogFiles should retrieve the list of log file names', () => {
    it('unless an error occurs', () => {
      service.getLogFiles().subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      const fileNames: string[] = [fileName];
      service.getLogFiles().subscribe(response => {
        expect(response).toEqual(fileNames);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files`, method: 'GET' });
      request.flush(fileNames);
    });
  });
  describe('getLogFileMetadata should retrieve the metadata of a specific log file', () => {
    it('unless an error occurs', () => {
      service.getLogFileMetadata(fileName).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files/${encodeURIComponent(fileName)}/metadata`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      const metadata: LogFileMetadata = {
        fileName,
        sizeBytes: 0,
        lastModified: 0,
        lineCount: 0
      };
      service.getLogFileMetadata(fileName).subscribe(response => {
        expect(response).toEqual(metadata);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files/${encodeURIComponent(fileName)}/metadata`, method: 'GET' });
      request.flush(metadata);
    });
  });
  describe('readLogFile should read lines from a specific log file', () => {
    const page: LogPage = {
        fileName,
        lines: [],
        currentPage: 0,
        totalPages: 0,
        totalLines: 0
      };
    it('unless an error occurs', () => {
      service.readLogFile(fileName).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}` && req.method === 'GET');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully with defaults', () => {
      service.readLogFile(fileName).subscribe(response => {
        expect(response).toEqual(page);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}` && req.method === 'GET');
      expect(request.request.params.get('page')).toEqual('0');
      expect(request.request.params.get('pageSize')).toEqual('100');
      request.flush(page);
    });
    it('successfully with specific params', () => {
      service.readLogFile(fileName, 1, 10).subscribe(response => {
        expect(response).toEqual(page);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}` && req.method === 'GET');
      expect(request.request.params.get('page')).toEqual('1');
      expect(request.request.params.get('pageSize')).toEqual('10');
      request.flush(page);
    });
  });
  describe('readLogFile should tail a specific log file', () => {
    const tail: TailResponse = {
      fileName,
      lines: ['A log line'],
      count: 1
    };
    it('unless an error occurs', () => {
      service.tailLogFile(fileName).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/tail` && req.method === 'GET');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully with defaults', () => {
      service.tailLogFile(fileName).subscribe(response => {
        expect(response).toEqual(tail);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/tail` && req.method === 'GET');
      expect(request.request.params.get('lines')).toEqual('100');
      request.flush(tail);
    });
    it('successfully with specific params', () => {
      service.tailLogFile(fileName, 10).subscribe(response => {
        expect(response).toEqual(tail);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/tail` && req.method === 'GET');
      expect(request.request.params.get('lines')).toEqual('10');
      request.flush(tail);
    });
  });
  describe('searchLogFile should search a specific log file for a search term', () => {
    const searchTerm = 'test';
    const search: SearchResponse = {
      fileName,
      searchTerm,
      results: [],
      count: 0
    };
    it('unless an error occurs', () => {
      service.searchLogFile(fileName, searchTerm).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/search` && req.method === 'GET');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully with defaults', () => {
      service.searchLogFile(fileName, searchTerm).subscribe(response => {
        expect(response).toEqual(search);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/search` && req.method === 'GET');
      expect(request.request.params.get('term')).toEqual(searchTerm);
      expect(request.request.params.get('maxResults')).toEqual('100');
      request.flush(search);
    });
    it('successfully with specific params', () => {
      service.searchLogFile(fileName, searchTerm, 10).subscribe(response => {
        expect(response).toEqual(search);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/search` && req.method === 'GET');
      expect(request.request.params.get('term')).toEqual(searchTerm);
      expect(request.request.params.get('maxResults')).toEqual('10');
      request.flush(search);
    });
  });
  describe('formatFileSize generates an appropriate string', () => {
    it('for 0 bytes', () => {
      expect(service.formatFileSize(0)).toEqual('0 Bytes');
    });
    it('for KB', () => {
      expect(service.formatFileSize(1024)).toEqual('1 KB');
      expect(service.formatFileSize(2020)).toEqual('1.97 KB');
      expect(service.formatFileSize(1048575)).toEqual('1024 KB');
    });
    it('for MB', () => {
      expect(service.formatFileSize(1048576)).toEqual('1 MB');
      expect(service.formatFileSize(2002000)).toEqual('1.91 MB');
      expect(service.formatFileSize(1073741823)).toEqual('1024 MB');
    });
    it('for GB', () => {
      expect(service.formatFileSize(1073741824)).toEqual('1 GB');
      expect(service.formatFileSize(2000200000)).toEqual('1.86 GB');
    });
  });
  it('formatTimestamp generates a formatted time stamp for display', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    expect(service.formatTimestamp(date.getTime())).toEqual(date.toLocaleString());
  });
});
