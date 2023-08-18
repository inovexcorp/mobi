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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { CreateRequestComponent } from '../createRequest/createRequest.component';
import { MergeRequestListComponent } from '../mergeRequestList/mergeRequestList.component';
import { MergeRequestViewComponent } from '../mergeRequestView/mergeRequestView.component';
import { MergeRequestsPageComponent } from './mergeRequestsPage.component';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { DCTERMS } from '../../../prefixes';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { MergeRequestFilterComponent } from '../merge-request-filter/merge-request-filter.component';
import { RecordCardComponent } from '../../../catalog/components/recordCard/recordCard.component';

describe('Merge Requests Page component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<MergeRequestsPageComponent>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let mergeRequestsManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    const request: MergeRequest[] = [{
        title: '',
        recordIri: '',
        date: '',
        creator: '',
        assignees: [],
        jsonld: {'@id': ''}
    }];
    const sortOptions: SortOption[] = [
        {
            field: DCTERMS + 'issued',
            asc: false,
            label: 'Issued (desc)'
        },
        {
            field: DCTERMS + 'issued',
            asc: true,
            label: 'Issued (asc)'
        },
        {
            field: DCTERMS + 'title',
            asc: false,
            label: 'Title (desc)'
        },
        {
            field: DCTERMS + 'title',
            asc: true,
            label: 'Title (asc)'
        },

    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                MergeRequestsPageComponent,
                MockComponent(MergeRequestListComponent),
                MockComponent(CreateRequestComponent),
                MockComponent(MergeRequestViewComponent),
                MockComponent(MergeRequestFilterComponent),
                MockComponent(RecordCardComponent),
            ],
            providers: [
                MockProvider(MergeRequestsStateService),
                MockProvider(MergeRequestManagerService)
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeRequestsPageComponent);
        element = fixture.debugElement;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        mergeRequestsManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        mergeRequestsManagerStub.sortOptions = sortOptions;
        mergeRequestsStateStub.requests = request;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        element = null;
        fixture = null;
        mergeRequestsStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-requests-page')).length).toBe(1);
            expect(element.queryAll(By.css('.row')).length).toBe(1);
        });
        it('if no request is selected and one is not being created', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('merge-request-list')).length).toBe(1);
            expect(element.queryAll(By.css('merge-request-view')).length).toBe(0);
            expect(element.queryAll(By.css('create-request')).length).toBe(0);
            expect(element.queryAll(By.css('.search-container')).length).toEqual(1);
            expect(element.queryAll(By.css('merge-request-filter')).length).toBe(1);
        });
        it('if a request is selected', function() {
            mergeRequestsStateStub.selected = {
                title: '',
                date: '',
                creator: '',
                recordIri: '',
                assignees: [],
                jsonld: {'@id': 'request'}
            };
            fixture.detectChanges();
            expect(element.queryAll(By.css('merge-request-list')).length).toBe(0);
            expect(element.queryAll(By.css('merge-request-view')).length).toBe(1);
            expect(element.queryAll(By.css('create-request')).length).toBe(0);
        });
        it('if a request is being created', function() {
            mergeRequestsStateStub.createRequest = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('merge-request-list')).length).toBe(0);
            expect(element.queryAll(By.css('merge-request-view')).length).toBe(0);
            expect(element.queryAll(By.css('create-request')).length).toBe(1);
        });
        it('should call startCreate when the Create Request button is clicked', function() {
            fixture.detectChanges();
            const button = element.queryAll(By.css('.search-container button'))[0];
            expect(button).not.toBeNull();
            button.triggerEventHandler('click', null);
            expect(mergeRequestsStateStub.startCreate).toHaveBeenCalledWith();
        });
    });
});
