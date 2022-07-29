/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PageEvent } from '@angular/material';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
    mockUtil
} from '../../../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { RecordCardComponent } from '../recordCard/recordCard.component';
import { RecordFiltersComponent } from '../recordFilters/recordFilters.component';
import { RecordsViewComponent } from './recordsView.component';

describe('Records View component', function() {
    let component: RecordsViewComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordsViewComponent>;
    let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let utilStub;

    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const record: JSONLDObject = {
        '@id': recordId,
        '@type': []
    };
    const sortOption: SortOption = {
        'asc': true,
        'label': '',
        'field': ''
    };
    const totalSize = 10;
    const headers = {'x-total-count': '' + totalSize};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                RecordsViewComponent,
                MockComponent(RecordFiltersComponent),
                MockComponent(RecordFiltersComponent),
                MockComponent(RecordCardComponent),
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(CatalogStateService),
                { provide: 'utilService', useClass: mockUtil }
            ],
        });
    });

    beforeEach(fakeAsync(function() {
        fixture = TestBed.createComponent(RecordsViewComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogStateStub = TestBed.get(CatalogStateService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get('utilService');

        this.records = [record];
        catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: this.records, headers: new HttpHeaders(headers)})));
    }));

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogStateStub = null;
        catalogManagerStub = null;
        utilStub = null;
    });

    describe('should initialize', function() {
        it('with the list of records', function() {
            spyOn(component, 'setRecords');
            component.ngOnInit();
            expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, catalogStateStub.recordFilterType, catalogStateStub.keywordFilterList, catalogStateStub.recordSortOption);
            expect(catalogStateStub.currentRecordPage).toEqual(0);
        });
    });
    describe('controller methods', function() {
        it('should open a Record', function() {
            component.openRecord(record);
            expect(catalogStateStub.selectedRecord).toEqual(record);
        });
        it('should change the sort', function() {
            catalogStateStub.recordSortOption = sortOption;
            spyOn(component, 'setRecords');
            component.changeSort();
            expect(catalogStateStub.currentRecordPage).toEqual(0);
            expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, catalogStateStub.recordFilterType, catalogStateStub.keywordFilterList, sortOption);
        });
        it('should change the filter', function() {
            spyOn(component, 'setRecords');
            component.changeFilter({recordType: 'test', keywordFilterList: ['keyword1']});
            expect(catalogStateStub.currentRecordPage).toEqual(0);
            expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, 'test', ['keyword1'], catalogStateStub.recordSortOption);
        });
        it('should search for records', function() {
            spyOn(component, 'search');
            component.searchRecords();
            expect(component.search).toHaveBeenCalledWith(catalogStateStub.recordSearchText);
        });
        it('should search for records with a provided search text', function() {
            spyOn(component, 'setRecords');
            component.search('test');
            expect(catalogStateStub.currentRecordPage).toEqual(0);
            expect(component.setRecords).toHaveBeenCalledWith('test', catalogStateStub.recordFilterType, catalogStateStub.keywordFilterList, catalogStateStub.recordSortOption);
        });
        it('should get the provided page of records', function() {
            const event = new PageEvent();
            event.pageIndex = 10;
            spyOn(component, 'setRecords');
            component.getRecordPage(event);
            expect(catalogStateStub.currentRecordPage).toEqual(10);
            expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, catalogStateStub.recordFilterType, catalogStateStub.keywordFilterList, catalogStateStub.recordSortOption);
        });
        describe('should set the list of records', function() {
            beforeEach(function() {
                catalogStateStub.recordFilterType = '';
                catalogStateStub.keywordFilterList = [];
                catalogStateStub.recordSearchText = '';
                catalogStateStub.recordSortOption = undefined;
                catalogStateStub.totalRecordSize = 0;
                component.records = [];
                component.catalogId = catalogId;
                this.searchText = 'search';
                this.recordType = 'type';
                this.keywords = ['keyword1'];
            });
            it('if getRecords resolves', fakeAsync(function() {
                component.setRecords(this.searchText, this.recordType, this.keywords, sortOption);
                tick();
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, {
                    pageIndex: catalogStateStub.currentRecordPage,
                    limit: catalogStateStub.recordLimit,
                    sortOption: sortOption,
                    type: this.recordType,
                    searchText: this.searchText,
                    keywords: this.keywords
                });
                expect(catalogStateStub.recordFilterType).toEqual(this.recordType);
                expect(catalogStateStub.recordSearchText).toEqual(this.searchText);
                expect(catalogStateStub.recordSortOption).toEqual(sortOption);
                expect(catalogStateStub.totalRecordSize).toEqual(totalSize);
                expect(component.records).toEqual([record]);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless getRecords rejects', fakeAsync(function() {
                catalogManagerStub.getRecords.and.returnValue(throwError('Error Message'));
                component.setRecords(this.searchText, this.recordType, this.keywords, sortOption);
                tick();
                expect(catalogStateStub.recordFilterType).toEqual('');
                expect(catalogStateStub.recordSearchText).toEqual('');
                expect(catalogStateStub.recordSortOption).toBeUndefined();
                expect(catalogStateStub.totalRecordSize).toEqual(0);
                expect(component.records).toEqual([]);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith('Error Message');
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.records-view')).length).toEqual(1);
        });
        ['mat-paginator', 'record-filters'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toBe(1);
            });
        });
        it('with a search field', function() {
            expect(element.queryAll(By.css('mat-form-field input.record-search')).length).toEqual(1);
        });
        it('with a select for sort options', function() {
            expect(element.queryAll(By.css('mat-form-field mat-select')).length).toEqual(1);
        });
        it('depending on how many records match the current query', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('record-card')).length).toEqual(this.records.length);
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            
            component.records = [];
            fixture.detectChanges();
            expect(element.queryAll(By.css('record-card')).length).toEqual(0);
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
        });
    });
});
