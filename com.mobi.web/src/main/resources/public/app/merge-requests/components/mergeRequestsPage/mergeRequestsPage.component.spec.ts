/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { MatOptionModule } from '@angular/material/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatGridListModule } from '@angular/material/grid-list';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { CreateRequestComponent } from '../createRequest/createRequest.component';
import { MergeRequestListComponent } from '../mergeRequestList/mergeRequestList.component';
import { MergeRequestViewComponent } from '../mergeRequestView/mergeRequestView.component';
import { MergeRequestsPageComponent } from './mergeRequestsPage.component';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';

describe('Merge Requests Page component', function() {
    let element: DebugElement;
    let fixture: ComponentFixture<MergeRequestsPageComponent>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatOptionModule,
                MatPaginatorModule,
                MatFormFieldModule,
                MatSelectModule,
                MatListModule,
                MatCardModule,
                MatInputModule,
                MatGridListModule
            ],
            declarations: [
                MergeRequestsPageComponent,
                MockComponent(MergeRequestListComponent),
                MockComponent(CreateRequestComponent),
                MockComponent(MergeRequestViewComponent),
            ],
            providers: [
                MockProvider(MergeRequestsStateService),
                MockProvider(MergeRequestManagerService),
                MockProvider(OntologyStateService)
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MergeRequestsPageComponent);
        element = fixture.debugElement;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
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
    });
});
