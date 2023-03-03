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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../test/ts/Shared';
import { Dataset } from '../models/dataset.interface';
import { DatasetManagerService } from './datasetManager.service';
import { DatasetStateService } from './datasetState.service';

describe('Dataset State service', function() {
    let service: DatasetStateService;
    let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                DatasetStateService,
                MockProvider(DatasetManagerService),
            ]
        });

        service = TestBed.inject(DatasetStateService);
        datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        datasetManagerStub = null;
    });

    it('should reset all state variables', function() {
        spyOn(service, 'resetPagination');
        service.reset();
        expect(service.resetPagination).toHaveBeenCalledWith();
    });
    describe('should set the results of dataset records', function() {
        beforeEach(function() {
            spyOn(service, 'setPagination');
        });
        it('unless an error occurs', fakeAsync(function() {
            datasetManagerStub.getDatasetRecords.and.callFake(() => throwError('Error Message'));
            service.setResults().subscribe(() => fail('Observable should have errored'), response => {
                expect(response).toEqual('Error Message');
            });
            tick();
            expect(datasetManagerStub.getDatasetRecords).toHaveBeenCalledWith(service.paginationConfig, true);
            expect(service.setPagination).not.toHaveBeenCalled();
        }));
        it('successfully', fakeAsync(function() {
            const record = {'@id': 'dataset'};
            const dataset: Dataset = {
                record,
                identifiers: []
            };
            const response = new HttpResponse({body: [[record]]});
            datasetManagerStub.splitDatasetArray.and.returnValue(dataset);
            datasetManagerStub.getDatasetRecords.and.callFake(() => of(response));
            service.setResults()
                .subscribe(response => {
                    expect(response).toEqual([dataset]);
                }, () => fail('Observable should have succeeded'));
            tick();
            expect(datasetManagerStub.getDatasetRecords).toHaveBeenCalledWith(service.paginationConfig, true);
            expect(service.setPagination).toHaveBeenCalledWith(response);
            expect(datasetManagerStub.splitDatasetArray).toHaveBeenCalledWith(([record]));
        }));
    });
    it('should reset all pagination related state variables', function() {
        service.resetPagination();
        expect(service.paginationConfig.pageIndex).toBe(0);
        expect(service.paginationConfig.searchText).toBe('');
        expect(service.totalSize).toBe(0);
    });
    it('should set the pagination variables based on a response', function() {
        service.setPagination(new HttpResponse({headers: new HttpHeaders({'x-total-count': '1'})}));
        expect(service.totalSize).toEqual(1);
    });
});
