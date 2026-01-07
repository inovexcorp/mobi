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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { CATALOG, DCTERMS, DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RequestRecordSelectComponent } from './requestRecordSelect.component';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { MergeRequestRecord } from '../../models/merge-request-record';

describe('Request Record Select component', function() {
    let component: RequestRecordSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RequestRecordSelectComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    const error = 'Error Message';
    const catalogId = 'catalogId';
    const ontologyMergeRequestRecord: MergeRequestRecord = {
        title: 'title',
        recordTypeIri: `${ONTOLOGYEDITOR}OntologyRecord`,
        displayIri: 'ontologyIRI',
        description: 'description',
        jsonld: {
            '@id': 'ontologyRecordId',
            '@type': [`${CATALOG}VersionedRDFRecord`, `${ONTOLOGYEDITOR}OntologyRecord`],
            [`${DCTERMS}title`]: [{ '@value': 'title' }],
            [`${DCTERMS}description`]: [{ '@value': 'description' }],
            [`${CATALOG}trackedIdentifier`]: [{ '@id': 'ontologyIRI' }]
        } 
    };
    const shapeGraphMergeRequestRecord: MergeRequestRecord = {
        title: 'title',
        recordTypeIri: `${SHAPESGRAPHEDITOR}ShapesGraphRecord`,
        displayIri: 'http://www.w3.org/ns/shacl#',
        description: 'description',
        jsonld: {
            '@id': 'shapeRecordId',
            '@type': [`${CATALOG}VersionedRDFRecord`, `${SHAPESGRAPHEDITOR}ShapesGraphRecord`],
            [`${DCTERMS}title`]: [{ '@value': 'title' }],
            [`${DCTERMS}description`]: [{ '@value': 'description' }],
            [`${CATALOG}trackedIdentifier`]: [{'@id': 'http://www.w3.org/ns/shacl#'}]
        } 
    };
    const mappingMergeRequestRecord: MergeRequestRecord = {
        title: 'title',
        recordTypeIri: `${DELIM}MappingRecord`,
        displayIri: 'mappingRecordId',
        description: 'description',
        jsonld: {
            '@id': 'mappingRecordId',
            '@type': [`${CATALOG}VersionedRDFRecord`, `${DELIM}MappingRecord`],
            [`${DCTERMS}title`]: [{ '@value': 'title' }],
            [`${DCTERMS}description`]: [{ '@value': 'description' }]
        } 
    };
    const totalSize = 3;
    const headers = {'x-total-count': '' + totalSize};
    const sortOption: SortOption = {
        'asc': true,
        'label': '',
        'field': ''
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
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
                MockComponent(RecordIconComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService),
                MockProvider(MergeRequestsStateService),
                MockProvider(ProgressSpinnerService),
                MockProvider(ToastService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RequestRecordSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        catalogManagerStub.localCatalog = {'@id': catalogId};
        const httpResponse = new HttpResponse<JSONLDObject[]>({ 
            body: [
                ontologyMergeRequestRecord.jsonld, 
                shapeGraphMergeRequestRecord.jsonld,
                mappingMergeRequestRecord.jsonld
            ], 
            headers: new HttpHeaders(headers) 
        });
        catalogManagerStub.getRecords.and.returnValue(of(httpResponse));
        sortOption.field = `${DCTERMS}title`;
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
        toastStub = null;
    });

    it('should initialize properly', function() {
        spyOn(component, 'setInitialRecords');
        component.ngOnInit();
        expect(component.catalogId).toEqual(catalogId);
        expect(component.config.type).toEqual([`${CATALOG}VersionedRDFRecord`]);
        expect(component.config.sortOption).toEqual(sortOption);
        expect(component.setInitialRecords).toHaveBeenCalledWith();
    });
    describe('controller methods', function() {
        it('should select a record', function() {
            component.selectRecord(ontologyMergeRequestRecord);
            expect(mergeRequestsStateStub.requestConfig.recordId).toEqual(ontologyMergeRequestRecord.jsonld['@id']);
            expect(mergeRequestsStateStub.selectedRecord).toEqual(ontologyMergeRequestRecord.jsonld);
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
                expect(component.mergeRequestRecords).toEqual([
                    ontologyMergeRequestRecord, 
                    shapeGraphMergeRequestRecord,
                    mappingMergeRequestRecord
                ]);
                expect(component.totalSize).toEqual(3);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(toastStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('unless an error occurs', fakeAsync(function() {
                catalogManagerStub.getRecords.and.returnValue(throwError(error));
                component.setRecords(10);
                tick();
                expect(component.config.pageIndex).toEqual(10);
                expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, component.config, true);
                expect(component.mergeRequestRecords).toEqual([]);
                expect(component.totalSize).toEqual(0);
                expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.mrRecords);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
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
            expect(element.queryAll(By.css('.records mat-grid-tile')).length).toEqual(component.mergeRequestRecords.length);
        });
        it('depending on whether a record is selected', function() {
            fixture.detectChanges();
            const card = element.queryAll(By.css('.records mat-card'))[0];
            expect(card.classes['selected']).toBeFalsy();

            mergeRequestsStateStub.requestConfig.recordId = ontologyMergeRequestRecord.jsonld['@id'];
            fixture.detectChanges();
            expect(card.classes['selected']).toBeTruthy();
        });
    });
});
