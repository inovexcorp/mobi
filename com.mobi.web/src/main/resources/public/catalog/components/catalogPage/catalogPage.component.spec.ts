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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { SharedModule } from '../../../shared/shared.module';
import { RecordsViewComponent } from '../recordsView/recordsView.component';
import { RecordViewComponent } from '../recordView/recordView.component';
import { RecordPermissionViewComponent } from "../recordPermissionView/recordPermissionView.component";
import { CatalogPageComponent } from './catalogPage.component';

describe('Catalog Page component', function() {
    let component: CatalogPageComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CatalogPageComponent>;
    let catalogStateStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                CatalogPageComponent,
                MockComponent(RecordViewComponent),
                MockComponent(RecordsViewComponent),
                MockComponent(RecordPermissionViewComponent)
            ],
            providers: [
                MockProvider(CatalogStateService)
            ],
        });
    });

    beforeEach(fakeAsync(function() {
        fixture = TestBed.createComponent(CatalogPageComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        catalogStateStub = TestBed.get(CatalogStateService);
    }));

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        catalogStateStub = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.catalog-page')).length).toEqual(1);
        });
        it('depending on whether a record is selected', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('records-view')).length).toBe(1);
            expect(element.queryAll(By.css('record-view')).length).toBe(0);

            catalogStateStub.selectedRecord = {};
            fixture.detectChanges();
            expect(element.queryAll(By.css('records-view')).length).toBe(0);
            expect(element.queryAll(By.css('record-view')).length).toBe(1);
        });
    });
});