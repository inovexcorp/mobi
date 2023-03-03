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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestListComponent } from './mergeRequestList.component';

describe('Merge Request List component', function() {
    let component: MergeRequestListComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeRequestListComponent>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
    let matDialog;

    const request: MergeRequest = {
        title: '',
        recordIri: '',
        date: '',
        creator: '',
        assignees: [],
        jsonld: {'@id': ''}
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                MatFormFieldModule,
                MatButtonModule,
                MatSelectModule,
                MatIconModule,
                MatMenuModule,
                MatDividerModule
            ],
            declarations: [
                MergeRequestListComponent,
                MockComponent(InfoMessageComponent),
            ],
            providers: [
                MockProvider(MergeRequestsStateService),
                { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
                    open: { afterClosed: () => of(true)}
                }) }
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeRequestListComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestsStateStub = null;
        matDialog = null;
    });

    it('should initialize correctly', function() {
        component.ngOnInit();
        expect(mergeRequestsStateStub.setRequests).toHaveBeenCalledWith(mergeRequestsStateStub.acceptedFilter);
    });
    describe('controller methods', function() {
        it('should show the delete confirmation overlay', fakeAsync(function() {
            component.showDeleteOverlay(request);
            tick();
            expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
            expect(mergeRequestsStateStub.deleteRequest).toHaveBeenCalledWith(request);
        }));
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-request-list')).length).toEqual(1);
            expect(element.queryAll(By.css('.search-container')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-select', '.search-container button'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on how many merge requests there are', function() {
            mergeRequestsStateStub.requests = [];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('.request')).length).toEqual(0);
            expect(element.queryAll(By.css('.mat-divider')).length).toEqual(0);

            const secondRequest = Object.assign({}, request);
            secondRequest.title = 'title';
            mergeRequestsStateStub.requests = [request, secondRequest];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('.request')).length).toEqual(mergeRequestsStateStub.requests.length);
            expect(element.queryAll(By.css('.mat-divider')).length).toEqual(1);
        });
        it('depending on how many assignees are on a request', function() {
            const copyRequest = Object.assign({}, request);
            mergeRequestsStateStub.requests = [copyRequest];
            fixture.detectChanges();
            const listItems = element.queryAll(By.css('.request .assignees li'));
            expect(listItems.length).toEqual(1);
            expect(listItems[0].nativeElement.innerHTML).toContain('None specified');

            copyRequest.assignees = ['userA', 'userB'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.request .assignees li')).length).toEqual(copyRequest.assignees.length);
        });
    });
    it('should set the correct state when a request is clicked', function() {
        mergeRequestsStateStub.requests = [request];
        fixture.detectChanges();

        const requestDiv = element.queryAll(By.css('.request'))[0];
        expect(requestDiv).not.toBeNull();
        requestDiv.triggerEventHandler('click', null);
        expect(mergeRequestsStateStub.selected).toEqual(request);
    });
    it('should call startCreate when the Create Request button is clicked', function() {
        const button = element.queryAll(By.css('.search-container button'))[0];
        expect(button).not.toBeNull();
        button.triggerEventHandler('click', null);
        expect(mergeRequestsStateStub.startCreate).toHaveBeenCalledWith();
    });
});
