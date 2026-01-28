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

import { MockProvider } from 'ng-mocks';
import { Observable } from 'rxjs';

import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { RESTError } from '../models/RESTError.interface';
import { LogFileMetadata, LogLevelResponse, LogPage, LogsManagerService, SearchResponse, TailResponse } from './logs-manager.service';

describe('Logs Manager Service', () => {
  let service: LogsManagerService;
  let httpMock: HttpTestingController;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

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
      providers: [
        LogsManagerService,
        MockProvider(ProgressSpinnerService)
      ],
    });
    service = TestBed.inject(LogsManagerService);
    httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    progressSpinnerStub.trackedRequest.and.callFake((ob) => ob);
  });

  afterEach(function() {
    cleanStylesFromDOM();
    service = null;
    httpMock = null;
    progressSpinnerStub = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('getLogFiles should retrieve the list of log file names', () => {
      const fileNames: string[] = [fileName];
    it('unless an error occurs', () => {
      service.getLogFiles().subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      service.getLogFiles().subscribe(response => {
        expect(response).toEqual(fileNames);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files`, method: 'GET' });
      request.flush(fileNames);
    });
    it('successfully with tracking', () => {
      service.getLogFiles(true).subscribe(response => {
        expect(response).toEqual(fileNames);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files`, method: 'GET' });
      request.flush(fileNames);
    });
  });
  describe('getLogFileMetadata should retrieve the metadata of a specific log file', () => {
    const metadata: LogFileMetadata = {
      fileName,
      sizeBytes: 0,
      lastModified: 0,
      lineCount: 0
    };
    it('unless an error occurs', () => {
      service.getLogFileMetadata(fileName).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files/${encodeURIComponent(fileName)}/metadata`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      service.getLogFileMetadata(fileName).subscribe(response => {
        expect(response).toEqual(metadata);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/files/${encodeURIComponent(fileName)}/metadata`, method: 'GET' });
      request.flush(metadata);
    });
    it('successfully with tracking', () => {
      service.getLogFileMetadata(fileName, true).subscribe(response => {
        expect(response).toEqual(metadata);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
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
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}` && req.method === 'GET');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully with defaults', () => {
      service.readLogFile(fileName).subscribe(response => {
        expect(response).toEqual(page);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
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
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}` && req.method === 'GET');
      expect(request.request.params.get('page')).toEqual('1');
      expect(request.request.params.get('pageSize')).toEqual('10');
      request.flush(page);
    });
    it('successfully with tracking', () => {
      service.readLogFile(fileName, 1, 10, true).subscribe(response => {
        expect(response).toEqual(page);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
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
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/tail` && req.method === 'GET');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully with defaults', () => {
      service.tailLogFile(fileName).subscribe(response => {
        expect(response).toEqual(tail);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
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
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/tail` && req.method === 'GET');
      expect(request.request.params.get('lines')).toEqual('10');
      request.flush(tail);
    });
    it('successfully with tracking', () => {
      service.tailLogFile(fileName, 10, true).subscribe(response => {
        expect(response).toEqual(tail);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
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
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/search` && req.method === 'GET');
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully with defaults', () => {
      service.searchLogFile(fileName, searchTerm).subscribe(response => {
        expect(response).toEqual(search);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
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
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/search` && req.method === 'GET');
      expect(request.request.params.get('term')).toEqual(searchTerm);
      expect(request.request.params.get('maxResults')).toEqual('10');
      request.flush(search);
    });
    it('successfully with tracking', () => {
      service.searchLogFile(fileName, searchTerm, 10, true).subscribe(response => {
        expect(response).toEqual(search);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne(req => req.url === `${service.prefix}/files/${encodeURIComponent(fileName)}/search` && req.method === 'GET');
      expect(request.request.params.get('term')).toEqual(searchTerm);
      expect(request.request.params.get('maxResults')).toEqual('10');
      request.flush(search);
    });
  });
  describe('getAllLoggers should retrieve all the configured loggers', () => {
    const loggers = {
      'com.mobi.catalog.api': 'INFO',
      'ROOT': 'WARN'
    };
    it('unless an error occurs', () => {
      service.getAllLoggers().subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      service.getAllLoggers().subscribe(response => {
        expect(response).toEqual(loggers);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels`, method: 'GET' });
      request.flush(loggers);
    });
    it('successfully with tracking', () => {
      service.getAllLoggers(true).subscribe(response => {
        expect(response).toEqual(loggers);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels`, method: 'GET' });
      request.flush(loggers);
    });
  });
  describe('getLoggerLevel should retrieve the log level of a package', () => {
    const packageName = 'com.mobi.catalog.api';
    it('unless an error occurs', () => {
      service.getLoggerLevel(packageName).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/${encodeURIComponent(packageName)}`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      const logLevelResponse: LogLevelResponse = {
        loggerName: packageName,
        level: 'INFO'
      };
      service.getLoggerLevel(packageName).subscribe(response => {
        expect(response).toEqual(logLevelResponse);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/${encodeURIComponent(packageName)}`, method: 'GET' });
      request.flush(logLevelResponse);
    });
  });
  describe('setLoggerLevel should set the log level of a package', () => {
    const packageName = 'com.mobi.catalog.api';
    const level = 'TRACE';
    it('unless an error occurs', () => {
      service.setLoggerLevel(packageName, level).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/${encodeURIComponent(packageName)}`, method: 'PUT' });
      expect(request.request.body).toEqual({ level });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      const logLevelResponse: LogLevelResponse = {
        loggerName: packageName,
        level
      };
      service.setLoggerLevel(packageName, level).subscribe(response => {
        expect(response).toEqual(logLevelResponse);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/${encodeURIComponent(packageName)}`, method: 'PUT' });
      expect(request.request.body).toEqual({ level });
      request.flush(logLevelResponse);
    });
  });
  describe('createLogger should create a new logger with the log level of a package', () => {
    const packageName = 'com.mobi.catalog.api';
    const level = 'TRACE';
    it('unless an error occurs', () => {
      service.createLogger(packageName, level).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels`, method: 'POST' });
      expect(request.request.body).toEqual({ loggerName: packageName, level });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      const logLevelResponse: LogLevelResponse = {
        loggerName: packageName,
        level
      };
      service.createLogger(packageName, level).subscribe(response => {
        expect(response).toEqual(logLevelResponse);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels`, method: 'POST' });
      expect(request.request.body).toEqual({ loggerName: packageName, level });
      request.flush(logLevelResponse);
    });
  });
  describe('deleteLogger should remove a logger for a package', () => {
    const packageName = 'com.mobi.catalog.api';
    it('unless an error occurs', () => {
      service.deleteLogger(packageName).subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/${encodeURIComponent(packageName)}`, method: 'DELETE' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      service.deleteLogger(packageName).subscribe(response => {
        expect(response).toEqual(undefined);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/${encodeURIComponent(packageName)}`, method: 'DELETE' });
      request.flush(null);
    });
  });
  describe('getAvailableLevels should retrieve all available log levels', () => {
    const levels = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'];
    it('unless an error occurs', () => {
      service.getAvailableLevels().subscribe(() => fail('Observable should have rejected'), response => {
        expect(response).toEqual(errorObj);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/available`, method: 'GET' });
      request.flush(errorObj, { status: 400, statusText: error });
    });
    it('successfully', () => {
      service.getAvailableLevels().subscribe(response => {
        expect(response).toEqual(levels);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/available`, method: 'GET' });
      request.flush(levels);
    });
    it('successfully with tracking', () => {
      service.getAvailableLevels(true).subscribe(response => {
        expect(response).toEqual(levels);
        expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
      }, () => {
        fail('Observable should have succeeded');
      });
      const request = httpMock.expectOne({ url: `${service.prefix}/levels/available`, method: 'GET' });
      request.flush(levels);
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
