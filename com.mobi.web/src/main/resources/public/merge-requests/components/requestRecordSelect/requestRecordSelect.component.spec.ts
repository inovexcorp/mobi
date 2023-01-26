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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule, MatFormFieldModule, MatGridListModule, MatInputModule, MatPaginatorModule, PageEvent } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../../test/ts/Shared';
import { DCTERMS, ONTOLOGYEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { UtilService } from '../../../shared/services/util.service';
import { RequestRecordSelectComponent } from './requestRecordSelect.component';

describe('Request Record Select component', function() {
    let component: RequestRecordSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RequestRecordSelectComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error Message';
    const catalogId = 'catalogId';
    const recordId = 'recordId';
    const record: JSONLDObject = {'@id': recordId};
    const totalSize = 3;
    const headers = {'x-total-count': '' + totalSize};
    const sortOption: SortOption = {
        'asc': true,
        'label': '',
        'field': ''
    };

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatFormFieldModule,
                MatInputModule,
                MatPaginatorModule,
                MatCardModule,
                MatGridListModule,
            ],
            declarations: [
                RequestRecordSelectComponent,
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(ProgressSpinnerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RequestRecordSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.get(CatalogManagerService);
        mergeRequestsStateStub = TestBed.get(MergeRequestsStateService);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        utilStub = TestBed.get(UtilService);

        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [record], headers: new HttpHeaders(headers)})));
        sortOption.field = DCTERMS + 'title';
        catalogManagerStub.sortOptions = [sortOption];
        mergeRequestsStateStub.requestConfig = {
            title: '',
            recordId: '',
            sourceBranchId: '',
            targetBranchId: '',
            removeSource: false
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
        mergeRequestsStateStub = null;
        progressSpinnerStub = null;
        utilStub = null;
    });

    it('should initialize properly', function() {
        spyOn(component, 'setInitialRecords');
        component.ngOnInit();
        expect(component.catalogId).toEqual(catalogId);
        expect(component.config.type).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
        expect(component.config.sortOption).toEqual(sortOption);
        expect(component.setInitialRecords).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        it('should select a record', function() {
            component.selectRecord(record);
            expect(mergeRequestsStateStub.requestConfig.recordId).toEqual(recordId);
            expect(mergeRequestsStateStub.selectedRecord).toEqual(record);
        });
        describe('should set the list of records to the specified page', function() {
            beforeEach(function() {
                component.catalogId = catalogId;
            });
            it('successfully', fakeAsync(function() {
                component.setRecords(10);
                tick();
                expect(component.config.pageIndex).toEqual(10);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.config, true);
                expect(component.records).toEqual([record]);
                expect(component.totalSize).toEqual(3);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecords.and.returnValue(throwError(error));
                component.setRecords(10);
                tick();
                expect(component.config.pageIndex).toEqual(10);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.config, true);
                expect(component.records).toEqual([]);
                expect(component.totalSize).toEqual(0);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
        });
        it('should set the initial page of records', function() {
            spyOn(component, 'setRecords');
            component.setInitialRecords();
            expect(component.setRecords).toHaveBeenCalledWith(0);
        });
        it('should handle a PageEvent', function() {
            spyOn(component, 'setRecords');
            const event = new PageEvent();
            event.pageIndex = 10;
            component.getPage(event);
            expect(component.setRecords).toHaveBeenCalledWith(10);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.request-record-select')).length).toEqual(1);
            expect(element.queryAll(By.css('.record-search-form')).length).toEqual(1);
            expect(element.queryAll(By.css('.records')).length).toEqual(1);
        });
        ['.record-search-form', 'mat-form-field', 'input.record-search', '.records', 'mat-grid-list', 'mat-paginator'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on how many records there are', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('.records mat-grid-tile')).length).toEqual(component.records.length);
        });
        it('depending on whether a record is selected', function() {
            fixture.detectChanges();
            const card = element.queryAll(By.css('.records mat-card'))[0];
            expect(card.classes['selected']).toBeFalsy();

            mergeRequestsStateStub.requestConfig.recordId = recordId;
            fixture.detectChanges();
            expect(card.classes['selected']).toBeTruthy();
        });
    });
});
