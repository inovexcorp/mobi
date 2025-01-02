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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { CATALOG, DATASET, DCTERMS, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { cleanStylesFromDOM } from '../../../test/ts/Shared';
import { CatalogStateService } from './catalogState.service';

describe('Catalog State service', () => {
  let service: CatalogStateService;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        CatalogStateService,
        MockProvider(CatalogManagerService),
      ]
    });

    service = TestBed.inject(CatalogStateService);
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    service = null;
    catalogManagerStub = null;
  });

  it('should initialize catalog state', () => {
    spyOn(service, 'initializeRecordSortOption');
    service.initialize();
    expect(service.initializeRecordSortOption).toHaveBeenCalledWith();
  });
  it('should initialize the recordSortOption', () => {
    catalogManagerStub.sortOptions = [{field: `${DCTERMS}modified`, asc: false, label: ''}, {field: `${DCTERMS}modified`, asc: true, label: ''}];
    service.initializeRecordSortOption();
    expect(service.recordSortOption).toEqual({field: `${DCTERMS}modified`, asc: false, label: ''});
  });
  it('should reset the important state variables', () => {
    spyOn(service, 'initializeRecordSortOption');
    service.totalRecordSize = 10;
    service.currentRecordPage = 10;
    service.recordTypeFilterList = [{ value: 'test', display: '', checked: true }];
    service.recordSearchText = 'test';
    service.keywordFilterList = [{ value: 'keyword1', display: '', checked: true}];
    service.keywordSearchText = 'key';
    service.creatorFilterList = [{ value: 'urn:userA', display: '', checked: true }];
    service.creatorSearchText = 'user';
    service.selectedRecord = {'@id': ''};
    service.reset();
    expect(service.totalRecordSize).toEqual(0);
    expect(service.currentRecordPage).toEqual(1);
    expect(service.initializeRecordSortOption).toHaveBeenCalledWith();
    expect(service.recordTypeFilterList).toEqual([]);
    expect(service.recordSearchText).toEqual('');
    expect(service.keywordFilterList).toEqual([]);
    expect(service.keywordSearchText).toEqual('');
    expect(service.creatorFilterList).toEqual([]);
    expect(service.creatorSearchText).toEqual('');
    expect(service.selectedRecord).toBeUndefined();
  });
  describe('should retrieve record type for a record', () => {
    it('if the record is an OntologyRecord', () => {
      expect(service.getRecordType({'@id': '', '@type': [`${ONTOLOGYEDITOR}OntologyRecord`]})).toEqual(`${ONTOLOGYEDITOR}OntologyRecord`);
    });
    it('if the record is a MappingRecord', () => {
      expect(service.getRecordType({'@id': '', '@type': [`${DELIM}MappingRecord`]})).toEqual(`${DELIM}MappingRecord`);
    });
    it('if the record is a DatasetRecord', () => {
      expect(service.getRecordType({'@id': '', '@type': [`${DATASET}DatasetRecord`]})).toEqual(`${DATASET}DatasetRecord`);
    });
    it('if the record is not a specified type', () => {
      expect(service.getRecordType({'@id': ''})).toEqual(`${CATALOG}Record`);
    });
  });
  describe('should retrieve the icon class for a record', () => {
    it('if the record is an OntologyRecord', () => {
      expect(service.getRecordIcon({'@id': '', '@type': [`${ONTOLOGYEDITOR}OntologyRecord`]})).toEqual('fa-sitemap');
    });
    it('if the record is a MappingRecord', () => {
      expect(service.getRecordIcon({'@id': '', '@type': [`${DELIM}MappingRecord`]})).toEqual('fa-map');
    });
    it('if the record is a DatasetRecord', () => {
      expect(service.getRecordIcon({'@id': '', '@type': [`${DATASET}DatasetRecord`]})).toEqual('fa-database');
    });
    it('if the record is a ShapesGraphRecord', () => {
      expect(service.getRecordIcon({'@id': '', '@type': [`${SHAPESGRAPHEDITOR}ShapesGraphRecord`]})).toEqual('mat rule');
    });
    it('if the record is a WorkflowRecord', () => {
      expect(service.getRecordIcon({'@id': '', '@type': [`${WORKFLOWS}WorkflowRecord`]})).toEqual('mat fact_check');
    });
    it('if the record is not a specified type', () => {
      expect(service.getRecordIcon({'@id': ''})).toEqual('fa-book');
    });
  });
});
