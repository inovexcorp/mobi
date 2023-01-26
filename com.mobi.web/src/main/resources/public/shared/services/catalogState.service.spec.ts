/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../test/ts/Shared';
import { CATALOG, DATASET, DCTERMS, DELIM, ONTOLOGYEDITOR } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { CatalogStateService } from './catalogState.service';

describe('Catalog State service', function() {
    let service: CatalogStateService;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                CatalogStateService,
                MockProvider(CatalogManagerService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(CatalogStateService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
    });

    afterEach(function () {
        cleanStylesFromDOM();
        service = null;
        catalogManagerStub = null;
    });

    it('should initialize catalog state', function() {
        spyOn(service, 'initializeRecordSortOption');
        service.initialize();
        expect(service.initializeRecordSortOption).toHaveBeenCalledWith();
    });
    it('should initialize the recordSortOption', function() {
        catalogManagerStub.sortOptions = [{field: DCTERMS + 'modified', asc: false, label: ''}, {field: DCTERMS + 'modified', asc: true, label: ''}];
        service.initializeRecordSortOption();
        expect(service.recordSortOption).toEqual({field: DCTERMS + 'modified', asc: false, label: ''});
    });
    it('should reset the important state variables', function() {
        spyOn(service, 'initializeRecordSortOption');
        service.totalRecordSize = 10;
        service.currentRecordPage = 10;
        service.recordFilterType = 'test';
        service.recordSearchText = 'test';
        service.selectedRecord = {'@id': ''};
        service.reset();
        expect(service.totalRecordSize).toEqual(0);
        expect(service.currentRecordPage).toEqual(1);
        expect(service.initializeRecordSortOption).toHaveBeenCalledWith();
        expect(service.recordFilterType).toEqual('');
        expect(service.recordSearchText).toEqual('');
        expect(service.selectedRecord).toBeUndefined();
    });
    describe('should retrieve record type for a record', function() {
        it('if the record is an OntologyRecord', function() {
            expect(service.getRecordType({'@id': '', '@type': [ONTOLOGYEDITOR + 'OntologyRecord']})).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
        });
        it('if the record is a MappingRecord', function() {
            expect(service.getRecordType({'@id': '', '@type': [DELIM + 'MappingRecord']})).toEqual(DELIM + 'MappingRecord');
        });
        it('if the record is a DatasetRecord', function() {
            expect(service.getRecordType({'@id': '', '@type': [DATASET + 'DatasetRecord']})).toEqual(DATASET + 'DatasetRecord');
        });
        it('if the record is not a specified type', function() {
            expect(service.getRecordType({'@id': ''})).toEqual(CATALOG + 'Record');
        });
    });
    describe('should retrieve the icon class for a record', function() {
        it('if the record is an OntologyRecord', function() {
            expect(service.getRecordIcon({'@id': '', '@type': [ONTOLOGYEDITOR + 'OntologyRecord']})).toEqual('fa-sitemap');
        });
        it('if the record is a MappingRecord', function() {
            expect(service.getRecordIcon({'@id': '', '@type': [DELIM + 'MappingRecord']})).toEqual('fa-map');
        });
        it('if the record is a DatasetRecord', function() {
            expect(service.getRecordIcon({'@id': '', '@type': [DATASET + 'DatasetRecord']})).toEqual('fa-database');
        });
        it('if the record is not a specified type', function() {
            expect(service.getRecordIcon({'@id': ''})).toEqual('fa-book');
        });
    });
});
