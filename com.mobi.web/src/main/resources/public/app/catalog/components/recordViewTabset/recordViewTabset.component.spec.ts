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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatTabsModule } from '@angular/material/tabs';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { BranchListComponent } from '../branchList/branchList.component';
import { RecordMarkdownComponent } from '../recordMarkdown/recordMarkdown.component';
import { ActivityListComponent } from '../../../shared/components/activity-list/activity-list.component';
import { RecordViewTabsetComponent } from './recordViewTabset.component';

describe('Record View Tabset component', function() {
    let component: RecordViewTabsetComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<RecordViewTabsetComponent>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

    const record: JSONLDObject = {'@id': '', '@type': []};

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                MatTabsModule
            ],
            declarations: [
                RecordViewTabsetComponent,
                MockComponent(BranchListComponent),
                MockComponent(RecordMarkdownComponent),
                MockComponent(ActivityListComponent)
            ],
            providers: [
                MockProvider(CatalogManagerService)
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(RecordViewTabsetComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;

        catalogManagerStub.isVersionedRDFRecord.and.returnValue(true);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogManagerStub = null;
    });

    it('should initialize correctly on record change', function() {
        component.record = record;
        expect(catalogManagerStub.isVersionedRDFRecord).toHaveBeenCalledWith(record);
        expect(component.isVersionedRDFRecord).toEqual(true);
    });
    describe('controller methods', function() {
        it('should call updateRecord', function() {
            spyOn(component.updateRecord, 'emit');
            component.updateRecordCall(record);
            expect(component.updateRecord.emit).toHaveBeenCalledWith(record);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.record-view-tabset')).length).toBe(1);
        });
        it('with a mat-tab-group', function() {
            expect(element.queryAll(By.css('mat-tab-group')).length).toBe(1);
        });
        it('with tabs for each page', fakeAsync(function() {
            component.record = record;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('mat-tab-body')).length).toBe(3);
        }));
        it('with a tab for Overview', fakeAsync(function() {
            component.record = record;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('record-markdown')).length).toBe(1);
        }));
        it('with a tab for Branches', fakeAsync(function() {
            component.record = record;
            component.tabIndex = 1;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('branch-list')).length).toBe(1);
        }));
        it('with a tab for Activity', fakeAsync(function() {
            component.record = record;
            component.tabIndex = 2;
            fixture.detectChanges();
            tick();
            expect(element.queryAll(By.css('app-activity-list')).length).toBe(1);
        }));
    });
});
