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
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
  cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { DATASET, DCTERMS } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { CatalogManagerService } from './catalogManager.service';
import { DiscoverStateService } from './discoverState.service';
import { DatasetManagerService } from './datasetManager.service';

describe('Dataset Manager service', function() {
  let service: DatasetManagerService;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
  let discoverStateStub: jasmine.SpyObj<DiscoverStateService>;
  let httpMock: HttpTestingController;

  const error = 'Error Message';
  const recordId = 'http://mobi.com/records/test';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DatasetManagerService,
        MockProvider(CatalogManagerService),
        MockProvider(ProgressSpinnerService),
        MockProvider(DiscoverStateService),
      ]
    });

    service = TestBed.inject(DatasetManagerService);
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    discoverStateStub = TestBed.inject(DiscoverStateService) as jasmine.SpyObj<DiscoverStateService>;
    httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

    progressSpinnerStub.track.and.callFake(ob => ob);
  });

  afterEach(function() {
    cleanStylesFromDOM();
    service = null;
    catalogManagerStub = null;
    discoverStateStub = null;
    httpMock = null;
    progressSpinnerStub = null;
  });

  describe('should retrieve a list of DatasetRecords', function() {
    beforeEach(function() {
      this.config = {
        limit: 10,
        offset: 0,
        sortOption: {
          field: `${DCTERMS}title`,
          asc: true
        },
        searchText: 'search',
      };
      this.url = service.prefix;
    });
    it('unless an error occurs', function() {
      service.getDatasetRecords(this.config)
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      request.flush('flush', { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.getDatasetRecords(this.config)
        .subscribe(response => {
          expect(response.body).toEqual([]);
        }, () => {
          fail('Observable should have succeeded');
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
      expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
      expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
      expect(request.request.params.get('searchText')).toEqual(this.config.searchText);
      expect(request.request.params.get('sort')).toEqual(this.config.sortOption.field);
      expect(request.request.params.get('ascending')).toEqual('' + this.config.sortOption.asc);
      request.flush([]);
    });
  });
  describe('should retrieve a DatasetRecord', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
    });
    it('unless an error occurs', function() {
      service.getDatasetRecord(recordId)
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      const request = httpMock.expectOne({ url: this.url, method: 'GET' });
      request.flush('flush', { status: 400, statusText: error });
    });
    it('when resolved', function() {
      service.getDatasetRecord(recordId)
        .subscribe(response => {
          expect(response).toEqual([]);
        }, () => fail('Observable should have succeeded'));
      const request = httpMock.expectOne({ url: this.url, method: 'GET' });
      request.flush([]);
    });
  });
  describe('should create a new Record', function() {
    beforeEach(function() {
      this.url = service.prefix;
      this.recordConfig = {
        title: 'Title',
        repositoryId: 'repo',
        datasetIRI: 'dataset',
        description: 'Description',
        keywords: ['keyword0', 'keyword1'],
        ontologies: ['ontology1', 'ontology2']
      };
    });
    it('unless an error occurs', function() {
      service.createDatasetRecord(this.recordConfig)
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      const request = httpMock.expectOne({ url: this.url, method: 'POST' });
      expect(request.request.body instanceof FormData).toBeTrue();
      request.flush('flush', { status: 400, statusText: error });
    });
    describe('when no error occurs', function() {
      beforeEach(function() {
        spyOn(service, 'initialize').and.returnValue(of());
      });
      it('using a datasetIRI, description, keywords, and ontologies', function() {
        service.createDatasetRecord(this.recordConfig)
          .subscribe(response => {
            expect(response).toBe(recordId);
          }, () => fail('Observable should have succeeded'));
        const request = httpMock.expectOne({ url: this.url, method: 'POST' });
        expect(request.request.body instanceof FormData).toBeTrue();
        expect((request.request.body as FormData).get('title').toString()).toEqual(this.recordConfig.title);
        expect((request.request.body as FormData).get('repositoryId').toString()).toEqual(this.recordConfig.repositoryId);
        expect((request.request.body as FormData).get('description')).toEqual(this.recordConfig.description);
        expect((request.request.body as FormData).get('datasetIRI')).toEqual(this.recordConfig.datasetIRI);
        expect((request.request.body as FormData).getAll('keywords')).toEqual(this.recordConfig.keywords);
        expect((request.request.body as FormData).getAll('ontologies')).toEqual(this.recordConfig.ontologies);
        request.flush(recordId);
        expect(service.initialize).toHaveBeenCalledWith();
      });
      it('not using a datasetIRI, description, keywords, or ontologies', function() {
        delete this.recordConfig.datasetIRI;
        delete this.recordConfig.description;
        delete this.recordConfig.keywords;
        delete this.recordConfig.ontologies;
        service.createDatasetRecord(this.recordConfig)
          .subscribe(response => {
            expect(response).toBe(recordId);
          }, () => fail('Observable should have succeeded'));
        const request = httpMock.expectOne({ url: this.url, method: 'POST' });
        expect(request.request.body instanceof FormData).toBeTrue();
        expect((request.request.body as FormData).get('title').toString()).toEqual(this.recordConfig.title);
        expect((request.request.body as FormData).get('repositoryId').toString()).toEqual(this.recordConfig.repositoryId);
        expect((request.request.body as FormData).get('description')).toBeNull();
        expect((request.request.body as FormData).get('datasetIRI')).toBeNull();
        expect((request.request.body as FormData).getAll('keywords')).toEqual([]);
        expect((request.request.body as FormData).getAll('ontologies')).toEqual([]);
        request.flush(recordId);
        expect(service.initialize).toHaveBeenCalledWith();
      });
    });
  });
  describe('should delete a DatasetRecord', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
      service.datasetRecords = [[{ '@id': recordId, '@type': [`${DATASET}DatasetRecord`] }]];
    });
    it('unless an error occurs', function() {
      service.deleteDatasetRecord(recordId)
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'DELETE');
      expect(request.request.params.get('force')).toEqual('false');
      request.flush('flush', { status: 400, statusText: error });
    });
    it('with force delete', function() {
      service.deleteDatasetRecord(recordId, true)
        .subscribe(() => { }, () => fail('Observable should have succeeded'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'DELETE');
      expect(request.request.params.get('force')).toEqual('true');
      request.flush(200);
      expect(service.datasetRecords).toEqual([]);
      expect(discoverStateStub.cleanUpOnDatasetDelete).toHaveBeenCalledWith(recordId);
    });
    it('without force delete', function() {
      service.deleteDatasetRecord(recordId)
        .subscribe(() => { }, () => fail('Observable should have succeeded'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'DELETE');
      expect(request.request.params.get('force')).toEqual('false');
      request.flush(200);
      expect(service.datasetRecords).toEqual([]);
      expect(discoverStateStub.cleanUpOnDatasetDelete).toHaveBeenCalledWith(recordId);
    });
  });
  describe('should clear a DatasetRecord', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/${encodeURIComponent(recordId)}/data`;
    });
    it('unless an error occurs', function() {
      service.clearDatasetRecord(recordId)
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'DELETE');
      expect(request.request.params.get('force')).toEqual('false');
      request.flush('flush', { status: 400, statusText: error });
    });
    it('with force delete', function() {
      service.clearDatasetRecord(recordId, true)
        .subscribe(() => { }, () => fail('Observable should have succeeded'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'DELETE');
      expect(request.request.params.get('force')).toEqual('true');
      request.flush(200);
      expect(discoverStateStub.cleanUpOnDatasetClear).toHaveBeenCalledWith(recordId);
    });
    it('without force delete', function() {
      service.clearDatasetRecord(recordId)
        .subscribe(() => { }, () => fail('Observable should have succeeded'));
      const request = httpMock.expectOne(req => req.url === this.url && req.method === 'DELETE');
      expect(request.request.params.get('force')).toEqual('false');
      request.flush(200);
      expect(discoverStateStub.cleanUpOnDatasetClear).toHaveBeenCalledWith(recordId);
    });
  });
  describe('should update a DatasetRecord', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/${encodeURIComponent(recordId)}`;
    });
    it('unless an error occurs', fakeAsync(function() {
      catalogManagerStub.updateRecord.and.callFake(() => throwError(error));
      service.updateDatasetRecord(recordId, '', [])
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      tick();
      expect(catalogManagerStub.updateRecord).toHaveBeenCalledWith(recordId, '', []);
    }));
    it('on success.', fakeAsync(function() {
      const expected = [
        [{ '@id': 'record1', [`${DCTERMS}title`]: [{ '@value': 'title 1' }] }],
        [{ '@id': 'record3', [`${DCTERMS}title`]: [{ '@value': 'title 3' }] }],
        [{ '@id': recordId, [`${DCTERMS}title`]: [{ '@value': '' }] }]
      ];
      service.datasetRecords = [
        [{ '@id': 'record1', [`${DCTERMS}title`]: [{ '@value': 'title 1' }] }],
        [{ '@id': recordId, [`${DCTERMS}title`]: [{ '@value': 'title 2' }] }],
        [{ '@id': 'record3', [`${DCTERMS}title`]: [{ '@value': 'title 3' }] }]
      ];
      catalogManagerStub.updateRecord.and.returnValue(of());
      service.updateDatasetRecord(recordId, '', expected[2])
        .subscribe(() => {
          expect(service.datasetRecords).toEqual(expected);
        }, () => fail('Observable should have succeeded'));
      tick();
      expect(catalogManagerStub.updateRecord).toHaveBeenCalledWith(recordId, '', expected[2]);
    }));
  });
  describe('should upload data to a Dataset', function() {
    beforeEach(function() {
      this.url = `${service.prefix}/${encodeURIComponent(recordId)}/data`;
    });
    it('unless an error occurs', function() {
      service.uploadData(recordId, new File([''], ''))
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      const request = httpMock.expectOne({ url: this.url, method: 'POST' });
      expect(request.request.body instanceof FormData).toBeTrue();
      request.flush('flush', { status: 400, statusText: error });
    });
    it('successfully', function() {
      service.uploadData(recordId, new File([''], ''))
        .subscribe(() => { }, () => fail('Observable should have succeeded'));
      const request = httpMock.expectOne({ url: this.url, method: 'POST' });
      expect(request.request.body instanceof FormData).toBeTrue();
      expect((request.request.body as FormData).get('file')).toBeDefined();
      request.flush(200);
    });
  });
  describe('initialize should call the correct method when getDatasetRecords was', function() {
    it('resolved', fakeAsync(function() {
      const datasetRecord = [{ '@id': 'dataset', '@type': [`${DATASET}DatasetRecord`] }];
      spyOn(service, 'getDatasetRecords').and.returnValue(of(new HttpResponse({ body: [datasetRecord] })));
      service.initialize()
        .subscribe(() => { }, () => fail('Observable should have succeeded'));
      tick();
      const config = {
        sortOption: {
          field: `${DCTERMS}title`,
          label: 'Title (asc)',
          asc: true
        }
      };
      expect(service.getDatasetRecords).toHaveBeenCalledWith(config);
      expect(service.datasetRecords).toEqual([datasetRecord]);
    }));
    it('rejected', fakeAsync(function() {
      spyOn(service, 'getDatasetRecords').and.returnValue(throwError(error));
      service.initialize()
        .subscribe(() => fail('Observable should have errored'), response => {
          expect(response).toEqual(error);
        });
      tick();
      const config = {
        sortOption: {
          field: `${DCTERMS}title`,
          label: 'Title (asc)',
          asc: true
        }
      };
      expect(service.getDatasetRecords).toHaveBeenCalledWith(config);
    }));
  });
  describe('should retrieve the ontology identifiers for a dataset', function() {
    beforeEach(function() {
      this.identifier = { '@id': 'id' };
      this.record = {
        '@id': recordId,
        [`${DATASET}ontology`]: [this.identifier]
      };
      this.arr = [this.identifier, { '@id': 'extra' }, this.record];
    });
    it('if passed the record', function() {
      spyOn(service, 'getRecordFromArray').and.returnValue(this.record);
      expect(service.getOntologyIdentifiers(this.arr)).toEqual([this.identifier]);
    });
    it('if not passed the record', function() {
      expect(service.getOntologyIdentifiers(this.arr, this.record)).toEqual([this.identifier]);
    });
  });
  it('should retrieve a DatasetRecord from a JSON-LD array', function() {
    const record = { '@id': recordId, '@type': [`${DATASET}DatasetRecord`] };
    const arr = [record, { '@id': 'other' }];
    expect(service.getRecordFromArray(arr)).toEqual(record);
  });
  it('should split a JSON-LD array into a Dataset object', function() {
    const record = { '@id': recordId, '@type': [`${DATASET}DatasetRecord`] };
    const identifier = { '@id': 'id' };
    spyOn(service, 'getRecordFromArray').and.returnValue(record);
    spyOn(service, 'getOntologyIdentifiers').and.returnValue([identifier]);
    expect(service.splitDatasetArray([record, identifier])).toEqual({ record, identifiers: [identifier] });
  });
});
