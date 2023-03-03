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
import { MatTabsModule } from '@angular/material/tabs';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { CommitChangesDisplayComponent } from '../../../shared/components/commitChangesDisplay/commitChangesDisplay.component';
import { CommitHistoryTableComponent } from '../../../shared/components/commitHistoryTable/commitHistoryTable.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { Difference } from '../../../shared/models/difference.class';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestDiscussionComponent } from '../mergeRequestDiscussion/mergeRequestDiscussion.component';
import { MergeRequestTabsetComponent } from './mergeRequestTabset.component';

describe('Merge Request Tabset component', function() {
    let component: MergeRequestTabsetComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MergeRequestTabsetComponent>;
    let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatTabsModule
            ],
            declarations: [
                MergeRequestTabsetComponent,
                MockComponent(InfoMessageComponent),
                MockComponent(MergeRequestDiscussionComponent),
                MockComponent(CommitChangesDisplayComponent),
                MockComponent(CommitHistoryTableComponent)
            ],
            providers: [
                MockProvider(MergeRequestsStateService),
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MergeRequestTabsetComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;

        component.request = {
            title: '',
            date: '',
            creator: '',
            recordIri: '',
            assignees: [],
            jsonld: {'@id': ''}
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        mergeRequestsStateStub = null;
    });

    describe('controller methods', function() {
        it('get an entity\'s name', function() {
            mergeRequestsStateStub.getEntityNameLabel.and.returnValue('label');
            expect(component.getEntityName('test')).toEqual('label');
            expect(mergeRequestsStateStub.getEntityNameLabel).toHaveBeenCalledWith('test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.merge-request-tabset')).length).toEqual(1);
        });
        it('with a mat-tab-group', function() {
            expect(element.queryAll(By.css('mat-tab-group')).length).toBe(1);
        });
        it('with tabs for each page', fakeAsync(function() {
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('mat-tab-body')).length).toBe(3);
        }));
        it('with a tab for merge-request-discussion', fakeAsync(function() {
            component.tabIndex = 0;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('merge-request-discussion')).length).toBe(1);
        }));
        it('depending on whether the request has any changes', fakeAsync(function() {
            component.tabIndex = 1;
            mergeRequestsStateStub.difference = new Difference();
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('info-message')).length).toEqual(1);
            expect(element.queryAll(By.css('commit-changes-display')).length).toBe(0);
            
            mergeRequestsStateStub.difference.additions = [{'@id': 'test'}];
            fixture.detectChanges();
            expect(element.queryAll(By.css('info-message')).length).toEqual(0);
            expect(element.queryAll(By.css('commit-changes-display')).length).toBe(1);
        }));
        it('with a tab for commit-history-table', fakeAsync(function() {
            component.tabIndex = 2;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('commit-history-table')).length).toBe(1);
        }));
    });
});
